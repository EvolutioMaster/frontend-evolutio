import { NextRequest, NextResponse } from 'next/server';
import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand
} from '@aws-sdk/client-bedrock-agent-runtime';

export async function POST(req: NextRequest) {
  const { inputText } = await req.json();

  const client = new BedrockAgentRuntimeClient({
    region: 'eu-north-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
  });

  const command = new InvokeAgentCommand({
    agentId: process.env.AWS_AGENT_ID!,
    agentAliasId: process.env.AWS_AGENT_ALIAS_ID!,
    sessionId: 'session-prueba-1',
    inputText: inputText
  });

  try {
    const response = await client.send(command);
    
    // La respuesta es un stream de eventos
    let outputText = '';
    
    if (response.completion) {
      for await (const event of response.completion) {
        if (event.chunk && event.chunk.bytes) {
          // Decodificar los bytes a texto
          const chunk = new TextDecoder().decode(event.chunk.bytes);
          outputText += chunk;
        }
      }
    }

    if (!outputText.trim()) {
      outputText = 'No response received from agent.';
    }

    return NextResponse.json({ response: outputText });
  } catch (err: any) {
    console.error('Error al invocar el agente:', err);
    return NextResponse.json(
      { error: 'Falló la conexión con Bedrock' },
      { status: 500 }
    );
  }
}
