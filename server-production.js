import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { jsPDF } from 'jspdf';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Serve static files from dist directory
app.use(express.static(join(__dirname, 'dist')));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/generate-report', async (req, res) => {
  try {
    const { answers } = req.body;

    // Generate personalized content using OpenAI
    const prompt = `You are a career coach creating a personalized leadership development report. Based on the following assessment answers, create a comprehensive career boost plan:

${JSON.stringify(answers, null, 2)}

Generate a detailed report with the following sections:
1. Executive Summary (2-3 sentences about their current situation)
2. Key Strengths Identified (3-4 bullet points)
3. Areas for Development (3-4 bullet points)
4. Immediate Action Items (5-7 concrete steps they can take this week)
5. 30-Day Quick Wins (3-4 goals for the next month)
6. Leadership Development Roadmap (3-month overview)
7. Recommended Resources (books, podcasts, or frameworks)

Keep it professional, actionable, and motivating. Focus on management to leadership transition.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an expert career coach specializing in leadership development for managers.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const reportContent = completion.choices[0].message.content;

    // Generate PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    
    // Set black background
    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Add logo/header
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('Careera', margin, margin + 10);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(200, 200, 200);
    doc.text('Your Leadership Development Report', margin, margin + 18);

    // Add date
    const today = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    doc.text(today, pageWidth - margin, margin + 18, { align: 'right' });

    // Add divider
    doc.setDrawColor(60, 60, 60);
    doc.line(margin, margin + 22, pageWidth - margin, margin + 22);

    // Add content
    let yPos = margin + 35;
    doc.setFontSize(11);
    doc.setTextColor(240, 240, 240);
    
    const lines = doc.splitTextToSize(reportContent, maxWidth);
    
    for (let line of lines) {
      if (yPos > pageHeight - margin) {
        doc.addPage();
        doc.setFillColor(10, 10, 10);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        yPos = margin;
      }
      doc.text(line, margin, yPos);
      yPos += 6;
    }

    // Add footer
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Careera Leadership Report - Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Convert to base64
    const pdfBase64 = doc.output('datauristring');

    res.json({
      success: true,
      pdf: pdfBase64,
      filename: `Careera-Leadership-Report-${Date.now()}.pdf`
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report'
    });
  }
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
