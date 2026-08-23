import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execPromise = util.promisify(exec);
const recruitOperatorId = BigInt('359656345734');
const operatorNamesById: Record<number, string> = {
  444310693746: 'Solid Snake',
};

async function runDissector(dissectorPath: string, tempFilePath: string) {
  const { stdout } = await execPromise(`"${dissectorPath}" "${tempFilePath}"`, {
    maxBuffer: 10 * 1024 * 1024,
  });
  return JSON.parse(stdout);
}

function replaceOperatorId(buffer: Buffer, sourceId: bigint) {
  const patched = Buffer.from(buffer);
  for (let offset = 0; offset <= patched.length - 8; offset += 1) {
    if (patched.readBigUInt64LE(offset) === sourceId) {
      patched.writeBigUInt64LE(recruitOperatorId, offset);
    } else if (patched.readBigUInt64BE(offset) === sourceId) {
      patched.writeBigUInt64BE(recruitOperatorId, offset);
    }
  }
  return patched;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Keep the temporary file on the current platform's temp volume.
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'r6-analyst-'));
    const tempFilePath = path.join(tempDirectory, path.basename(file.name));
    await fs.writeFile(tempFilePath, buffer);

    const dissectorPath = path.join(process.cwd(), 'bin', 'r6-dissect.exe');

    try {
      let matchData;
      try {
        matchData = await runDissector(dissectorPath, tempFilePath);
      } catch (dissectError: unknown) {
        const message = dissectError instanceof Error ? dissectError.message : String(dissectError);
        const unknownOperator = message.match(/role unknown for operator ID (\d+)/);
        if (!unknownOperator) throw dissectError;

        const unknownOperatorId = BigInt(unknownOperator[1]);
        await fs.writeFile(tempFilePath, replaceOperatorId(buffer, unknownOperatorId));
        matchData = await runDissector(dissectorPath, tempFilePath);
        for (const player of matchData.players || []) {
          if (player.operator?.name === 'Recruit' && player.operator?.id === Number(recruitOperatorId)) {
            player.operator.name = `Unknown Operator (${unknownOperatorId})`;
            player.operator.id = Number(unknownOperatorId);
          }
        }
      }

      for (const player of matchData.players || []) {
        const knownOperatorName = operatorNamesById[player.operator?.id];
        const unknownOperator = player.operator?.name?.match(/^Operator\((\d+)\)$/);
        if (knownOperatorName) {
          player.operator.name = knownOperatorName;
        } else if (unknownOperator) {
          player.operator.name = `Unknown Operator (${unknownOperator[1]})`;
        }
      }

      await fs.rm(tempDirectory, { recursive: true, force: true });

      return NextResponse.json({ success: true, output: matchData });
    } catch (parseError: unknown) {
      // Ensure temp file is cleaned up even if parsing fails
      await fs.rm(tempDirectory, { recursive: true, force: true });
      const message = parseError instanceof Error ? parseError.message : String(parseError);
      return NextResponse.json({ error: `Dissect error: ${message}` }, { status: 500 });
    }

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}