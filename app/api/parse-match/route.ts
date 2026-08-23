import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs/promises';
import path from 'path';

const execPromise = util.promisify(exec);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Save the uploaded file temporarily in a local folder
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempFilePath = path.join(process.cwd(), file.name);
    await fs.writeFile(tempFilePath, buffer);

    // Path to your binary executable
    const dissectPath = path.join(process.cwd(), 'bin', 'r6-dissect.exe');

    // Run r6-dissect to get match info (or dump json)
    const { stdout, stderr } = await execPromise(`"${dissectPath}" --info "${tempFilePath}"`);

    // Clean up the temporary file after parsing
    await fs.unlink(tempFilePath);

    return NextResponse.json({ success: true, output: stdout });
  } catch (error: any) {
    console.error('Parsing error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}