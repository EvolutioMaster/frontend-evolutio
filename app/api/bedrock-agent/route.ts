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
      inputText
    });

    const response: InvokeAgentCommandOutput = await client.send(command);

    let outputText = '';
    const textChunks: string[] = [];

    if (response.completion) {
      try {
        for await (const chunk of response.completion) {
          console.log('Chunk structure:', JSON.stringify(chunk, null, 2));

          if (chunk.chunk?.bytes) {
            const decoder = new TextDecoder('utf-8');
            const decodedText = decoder.decode(chunk.chunk.bytes);
            console.log('Decoded chunk bytes:', decodedText);

            if (
              !decodedText.includes('"options":') &&
              !decodedText.includes('"messageStream":') &&
              !decodedText.includes('"decoder":') &&
              decodedText.trim().length > 0
            ) {
              textChunks.push(decodedText);
            }
          }

          //if (chunk.trace?.orchestrationTrace?.modelInvocationOutput?.parsedResponse?.text) {
          //  console.log('Found text in orchestrationTrace:', chunk.trace.orchestrationTrace.modelInvocationOutput.parsedResponse.text);
          //  textChunks.push(chunk.trace.orchestrationTrace.modelInvocationOutput.parsedResponse.text);
          //}

          //if (chunk.trace?.orchestrationTrace?.rationale?.text) {
          //  console.log('Found text in rationale:', chunk.trace.orchestrationTrace.rationale.text);
          //  textChunks.push(chunk.trace.orchestrationTrace.rationale.text);
         // }

          //if (chunk.trace?.postProcessingTrace?.modelInvocationOutput?.parsedResponse?.text) {
            //console.log('Found text in postProcessingTrace:', chunk.trace.postProcessingTrace.modelInvocationOutput.parsedResponse.text);
            //textChunks.push(chunk.trace.postProcessingTrace.modelInvocationOutput.parsedResponse.text);
          //}
        }

        console.log('All text chunks collected:', textChunks);
        outputText = textChunks.join(' ').trim();

        if (!outputText) {
          console.log('No text found in chunks, using fallback response');
          outputText = 'Hola, gracias por contactar con el asistente de TotalEnergies. ¿En qué puedo ayudarte específicamente?';
        }
      } catch (streamError) {
        console.error('Error processing stream:', streamError);
        outputText = 'Error al procesar la respuesta del agente.';
      }
    } else {
      outputText = 'No se recibió respuesta del agente.';
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
