import { NextRequest, NextResponse } from 'next/server';
import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
  InvokeAgentCommandOutput
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
      agentId: process.env.AWS_AGENT_ID!,
      agentAliasId: process.env.AWS_AGENT_ALIAS_ID!,
      sessionId: 'session-prueba-1',
      inputText: inputText
    });

    const response: InvokeAgentCommandOutput = await client.send(command);

    // Manejo simplificado de la respuesta
    let outputText = '';
    
    if (response.completion) {
      // Si hay completion directa
      if (typeof response.completion === 'string') {
        outputText = response.completion;
      } else {
        // Si es un stream, lo convertimos a string
        outputText = JSON.stringify(response.completion);
      }
    } else {
      outputText = 'No response received from agent.';
    }

    return NextResponse.json({ response: outputText });
  } catch (error: unknown) {
    console.error('Bedrock connection error:', error);
    return NextResponse.json(
      { error: 'Falló la conexión con Bedrock' },
      { status: 500 }
    );
  }
}

