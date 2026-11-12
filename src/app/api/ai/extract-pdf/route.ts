import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import { getSessionUser } from '@/lib/auth';

const execFileAsync = promisify(execFile);
const PYTHON_PATH = 'C:\\Users\\karlv\\AppData\\Local\\Python\\pythoncore-3.14-64\\python.exe';

export async function POST(req: NextRequest) {
  let tmpPath: string | null = null;

  try {
    const token = req.cookies.get('invoicer_session')?.value;
    const session = getSessionUser(token);

    if (!session) {
      return NextResponse.json({ success: false, error: 'Ej auktoriserad' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Ingen fil mottagen' }, { status: 400 });
    }

    const filename = file.name;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // If text file
    if (filename.endsWith('.txt') || filename.endsWith('.csv') || filename.endsWith('.json')) {
      const text = buffer.toString('utf-8');
      return NextResponse.json({
        success: true,
        filename,
        text,
        charCount: text.length,
      });
    }

    // If PDF file, use PyMuPDF to extract text via a temp file
    // (passing base64 as argv hits Windows ENAMETOOLONG on larger PDFs)
    if (filename.toLowerCase().endsWith('.pdf')) {
      tmpPath = join(tmpdir(), `invoicer-pdf-${randomBytes(8).toString('hex')}.pdf`);
      await writeFile(tmpPath, buffer);

      const pyScript = `
import sys, pymupdf
try:
    doc = pymupdf.open(sys.argv[1])
    pages_text = [page.get_text() for page in doc]
    full_text = '\\n--- SIDA ---\\n'.join(pages_text)
    print(full_text)
except Exception as e:
    sys.stderr.write(str(e))
    sys.exit(1)
`;

      const { stdout, stderr } = await execFileAsync(PYTHON_PATH, ['-c', pyScript, tmpPath], {
        maxBuffer: 10 * 1024 * 1024,
      });

      if (stderr && !stdout) {
        throw new Error(stderr);
      }

      const extractedText = stdout.trim();
      return NextResponse.json({
        success: true,
        filename,
        text: extractedText,
        charCount: extractedText.length,
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Okänt filformat. Vänligen ladda upp PDF eller textfil.',
    }, { status: 400 });
  } catch (err: any) {
    console.error('Error in extract-pdf:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Kunde inte läsa PDF-filen',
    }, { status: 500 });
  } finally {
    if (tmpPath) {
      await unlink(tmpPath).catch(() => {});
    }
  }
}
