import { NextRequest, NextResponse } from 'next/server';
import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand
} from '@aws-sdk/client-bedrock-agent-runtime';

export async function POST(req: NextRequest) {
  try {
    const { inputText } = await req.json();

    const client = new BedrockAgentRuntimeClient({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });

    const command = new InvokeAgentCommand({
      agentId: process.env.AWS_REPORT_AGENT_ID!,
      agentAliasId: process.env.AWS_REPORT_AGENT_ALIAS_ID!,
      sessionId: 'session-informe-' + Date.now(),
      inputText: inputText // Cambio principal: usar inputText directamente
    });

    const response = await client.send(command);
    
    let fullText = '';
    
    // Manejo correcto del stream de completion
    if (response.completion) {
      const decoder = new TextDecoder();
      
      try {
        for await (const event of response.completion) {
          // Verificar si es un evento de chunk
          if (event.chunk?.bytes) {
            const chunkText = decoder.decode(event.chunk.bytes);
            fullText += chunkText;
          }
          
          // También manejar otros tipos de eventos si es necesario
          if (event.trace) {
            console.log('Trace event:', event.trace);
          }
          
          if (event.returnControl) {
            console.log('Return control event:', event.returnControl);
          }
        }
      } catch (streamError) {
        console.error('Error procesando stream:', streamError);
        throw new Error(`Error procesando stream: ${streamError.message || streamError}`);
      }
    }

    // Verificar que tenemos contenido
    if (!fullText.trim()) {
      console.warn('No se recibió contenido del agente');
      return NextResponse.json({ 
        error: 'El agente no devolvió contenido',
        markdown: ''
      }, { status: 200 });
    }

    return NextResponse.json({ markdown: fullText.trim() });
    
  } catch (error) {
    console.error('Error generando informe:', error);
    
    // Manejo más detallado de errores
    let errorMessage = 'No se pudo generar el informe';
    let errorDetails = 'Error desconocido';
    
    if (error instanceof Error) {
      errorDetails = error.message;
      
      // Errores específicos de AWS
      if (error.name === 'ValidationException') {
        errorMessage = 'Error de validación en los parámetros';
      } else if (error.name === 'ResourceNotFoundException') {
        errorMessage = 'Agente o alias no encontrado';
      } else if (error.name === 'AccessDeniedException') {
        errorMessage = 'Sin permisos para acceder al agente';
      } else if (error.name === 'ThrottlingException') {
        errorMessage = 'Demasiadas solicitudes, intenta más tarde';
      }
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: errorDetails
    }, { status: 500 });
  }
}