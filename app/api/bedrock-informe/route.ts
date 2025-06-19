import { NextRequest, NextResponse } from 'next/server';
import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand
} from '@aws-sdk/client-bedrock-agent-runtime';
 
export async function POST(req: NextRequest) {
  try {
    const { inputText } = await req.json();
    if (!inputText?.trim()) {
      return NextResponse.json({ error: 'Input vacío' }, { status: 400 });
    }
 
    const client = new BedrockAgentRuntimeClient({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });
 
    const sessionId = 'session-informe-' + Date.now();
    let fullMarkdown = '';
 
    for (let apartado = 1; apartado <= 3; apartado++) {
      // ✅ Prompt simplificado sin caracteres especiales problemáticos
      const prompt = `${inputText}. Genera solo el apartado ${apartado} del informe en formato Markdown.`;
 
      const command = new InvokeAgentCommand({
        agentId: process.env.AWS_REPORT_AGENT_ID!,
        agentAliasId: process.env.AWS_REPORT_AGENT_ALIAS_ID!,
        sessionId,
        inputText: prompt.trim()  // ✅ Limpiar espacios y asegurar formato
      });
 
      const response = await client.send(command);
 
      // ✅ CORREGIDO: Manejo correcto según AWS SDK v3 docs
      let apartadoTexto = '';
 
      if (typeof (response as any).output?.text === 'string') {
        // Respuesta no-stream (fallback por si existe)
        apartadoTexto = (response as any).output.text;
      } else if (response.completion) {
        // ✅ Manejo correcto del streaming según docs oficiales
        try {
          for await (const chunkEvent of response.completion) {
            if (chunkEvent.chunk?.bytes) {
              const decoded = new TextDecoder("utf-8").decode(chunkEvent.chunk.bytes);
              apartadoTexto += decoded;
            }
          }
        } catch (streamError) {
          console.error(`Error leyendo stream del apartado ${apartado}:`, streamError);
          throw new Error(`Error procesando apartado ${apartado}`);
        }
      } else {
        console.warn(`No se recibió contenido para el apartado ${apartado}`);
      }
 
      if (apartadoTexto.trim()) {
        fullMarkdown += apartadoTexto.trim() + '\n\n';
      }
    }
 
    return NextResponse.json({ 
      markdown: fullMarkdown.trim(),
      sessionId 
    });
    
  } catch (err: unknown) {
    console.error('Error generando informe:', err);
    return NextResponse.json(
      { 
        error: 'Falló la generación', 
        details: err instanceof Error ? err.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
