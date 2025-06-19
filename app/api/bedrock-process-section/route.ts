import { NextRequest, NextResponse } from 'next/server';
import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand
} from '@aws-sdk/client-bedrock-agent-runtime';

// Definir tipos para las secciones
interface ReportSection {
  id: number;
  title: string;
  content: string;
  processed: boolean;
}

// Función para dividir el informe en secciones
function parseReportSections(text: string): ReportSection[] {
  const sections: ReportSection[] = [];
  
  // Dividir por números seguidos de punto (1., 2., etc.) o por títulos
  const sectionRegex = /(?:^|\n)(\d+(?:\.\d+)*\.?\s+[^\n]+)/gm;
  const matches = [...text.matchAll(sectionRegex)];
  
  for (let i = 0; i < matches.length; i++) {
    const currentMatch = matches[i];
    const nextMatch = matches[i + 1];
    
    const startIndex = currentMatch.index || 0;
    const endIndex = nextMatch ? (nextMatch.index || text.length) : text.length;
    
    const sectionContent = text.slice(startIndex, endIndex).trim();
    const title = currentMatch[1].trim();
    
    const section: ReportSection = {
      id: i + 1,
      title: title,
      content: sectionContent,
      processed: false
    };
    
    sections.push(section);
  }
  
  return sections;
}

export async function POST(req: NextRequest) {
  try {
    const { inputText } = await req.json();

    // Debug: verificar variables de entorno
    console.log('AWS_REGION:', process.env.AWS_REGION);
    console.log('AWS_REPORT_AGENT_ID:', process.env.AWS_REPORT_AGENT_ID);
    console.log('AWS_REPORT_AGENT_ALIAS_ID:', process.env.AWS_REPORT_AGENT_ALIAS_ID);
    
    // Validar que las variables requeridas estén presentes
    if (!process.env.AWS_REPORT_AGENT_ALIAS_ID) {
      throw new Error('AWS_REPORT_AGENT_ALIAS_ID no está configurada');
    }
    
    if (!process.env.AWS_REPORT_AGENT_ID) {
      throw new Error('AWS_REPORT_AGENT_ID no está configurada');
    }

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
      inputText: inputText
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
        throw new Error(`Error procesando stream: ${(streamError as Error).message || streamError}`);
      }
    }

    // Verificar que tenemos contenido
    if (!fullText.trim()) {
      console.warn('No se recibió contenido del agente');
      return NextResponse.json({ 
        error: 'El agente no devolvió contenido',
        markdown: '',
        sections: []
      }, { status: 200 });
    }

    // Dividir el texto en apartados
    const sections = parseReportSections(fullText.trim());
    
    return NextResponse.json({ 
      markdown: fullText.trim(),
      sections: sections 
    });
    
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