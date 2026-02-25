import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import axios from 'axios';
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
const distPath = join(__dirname, 'dist');

app.use('/assets', express.static(join(distPath, 'assets'), {
  immutable: true,
  maxAge: '1y',
}));

app.use(express.static(distPath, {
  maxAge: '1h',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    }
  },
}));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const NAPKIN_API_KEY = 'sk-987d47287977de04d921b4c62be776607dee5046e70aae0df7af904638c1bfd9';

// Generate illustration using Napkin API
async function generateIllustration(prompt) {
  try {
    const response = await axios.post(
      'https://api.napkin.ai/v1/generate',
      {
        prompt,
        style: 'minimal',
        format: 'png',
      },
      {
        headers: {
          'Authorization': `Bearer ${NAPKIN_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (response.data && response.data.imageUrl) {
      // Download the image and convert to base64
      const imageResponse = await axios.get(response.data.imageUrl, { responseType: 'arraybuffer' });
      const base64 = Buffer.from(imageResponse.data, 'binary').toString('base64');
      return `data:image/png;base64,${base64}`;
    }
  } catch (error) {
    console.error('Error generating illustration:', error.message);
    return null;
  }
}

app.post('/api/generate-report', async (req, res) => {
  try {
    const { answers, variant } = req.body;

    console.log(`Generating report for variant ${variant}...`);

    // Step 1: Analyze responses with OpenAI
    const analysisPrompt = `You are an expert leadership coach analyzing a management assessment. Based on these responses, provide a detailed analysis:

${JSON.stringify(answers, null, 2)}

Provide your analysis in the following JSON structure:
{
  "leadershipScore": 65-95 (number),
  "leadershipStage": "Brief stage like: New Manager → Confident Leader",
  "executiveSummary": "2-3 sentence summary of current situation and next evolution",
  "competencies": [
    {"name": "Strategic Thinking", "score": 65-95, "level": "Emerging/Developing/Strong/Advanced"},
    {"name": "Delegation & Empowerment", "score": 65-95, "level": "..."},
    {"name": "Coaching & Feedback", "score": 65-95, "level": "..."},
    {"name": "Influence & Stakeholder Alignment", "score": 65-95, "level": "..."},
    {"name": "Execution & Accountability", "score": 65-95, "level": "..."},
    {"name": "Emotional Intelligence", "score": 65-95, "level": "..."}
  ],
  "archetype": {
    "name": "The [Archetype Name]",
    "traits": ["trait 1", "trait 2", "trait 3", "trait 4", "trait 5"]
  },
  "topGrowthAreas": [
    {"title": "Area 1", "description": "One sentence description"},
    {"title": "Area 2", "description": "One sentence description"},
    {"title": "Area 3", "description": "One sentence description"}
  ],
  "roadmap": {
    "month1": {"title": "Month 1 Focus", "actions": ["action 1", "action 2"]},
    "month2": {"title": "Month 2 Focus", "actions": ["action 1", "action 2"]},
    "month3": {"title": "Month 3 Focus", "actions": ["action 1", "action 2"]}
  },
  "keyInsight": "One powerful sentence about their next level"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an expert leadership coach. Respond only with valid JSON.' },
        { role: 'user', content: analysisPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const analysis = JSON.parse(completion.choices[0].message.content);
    console.log('Analysis complete:', analysis.leadershipScore);

    // Step 2: Generate illustrations (async, don't wait too long)
    console.log('Generating illustrations...');
    const illustrationPromises = [
      generateIllustration('minimalist diagram of leadership growth path, professional, clean lines'),
      generateIllustration('circular competency radar chart, minimal design, black and white'),
      generateIllustration('timeline roadmap with milestones, minimal professional style'),
    ];

    const illustrations = await Promise.race([
      Promise.all(illustrationPromises),
      new Promise(resolve => setTimeout(() => resolve([null, null, null]), 8000))
    ]);

    console.log('Illustrations generated');

    // Step 3: Create beautiful PDF with jsPDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    // Helper function to add new page if needed
    const checkNewPage = (requiredSpace = 20) => {
      if (yPos + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };

    // Cover Page
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('From Manager to Respected Leader', pageWidth / 2, 80, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('Personalized Leadership Growth Report', pageWidth / 2, 95, { align: 'center' });
    
    yPos = 120;
    doc.setFontSize(11);
    doc.text(`Assessment Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, yPos);
    yPos += 10;
    doc.text(`Leadership Stage: ${analysis.leadershipStage}`, margin, yPos);
    
    yPos = 180;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(13);
    doc.text('Leadership isn\'t a promotion. It\'s a transition.', pageWidth / 2, yPos, { align: 'center' });

    // Page 2: Executive Summary
    doc.addPage();
    yPos = margin;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Executive Summary', margin, yPos);
    yPos += 15;
    
    doc.setFontSize(14);
    doc.text(`Leadership Readiness Score: ${analysis.leadershipScore} / 100`, margin, yPos);
    yPos += 15;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const summaryLines = doc.splitTextToSize(analysis.executiveSummary, pageWidth - 2 * margin);
    doc.text(summaryLines, margin, yPos);
    yPos += summaryLines.length * 7 + 15;

    // Competencies Table
    doc.addPage();
    yPos = margin;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Leadership Competency Breakdown', margin, yPos);
    yPos += 20;
    
    doc.setFontSize(11);
    doc.text('Competency', margin, yPos);
    doc.text('Score', margin + 110, yPos);
    doc.text('Level', margin + 140, yPos);
    yPos += 10;
    
    doc.setFont('helvetica', 'normal');
    analysis.competencies.forEach(comp => {
      checkNewPage();
      doc.text(comp.name, margin, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(comp.score.toString(), margin + 110, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(comp.level, margin + 140, yPos);
      yPos += 10;
    });

    // Archetype
    doc.addPage();
    yPos = margin;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(`Your Leadership Archetype: ${analysis.archetype.name}`, margin, yPos);
    yPos += 15;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    analysis.archetype.traits.forEach(trait => {
      checkNewPage();
      doc.text(`• ${trait}`, margin, yPos);
      yPos += 8;
    });

    // Growth Areas
    doc.addPage();
    yPos = margin;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Top 3 Growth Areas', margin, yPos);
    yPos += 20;
    
    analysis.topGrowthAreas.forEach((area, idx) => {
      checkNewPage(25);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(`${idx + 1}. ${area.title}`, margin, yPos);
      yPos += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const descLines = doc.splitTextToSize(area.description, pageWidth - 2 * margin);
      doc.text(descLines, margin, yPos);
      yPos += descLines.length * 7 + 12;
    });

    // 90-Day Roadmap
    doc.addPage();
    yPos = margin;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('90-Day Leadership Roadmap', margin, yPos);
    yPos += 20;
    
    const months = [analysis.roadmap.month1, analysis.roadmap.month2, analysis.roadmap.month3];
    months.forEach((month, idx) => {
      checkNewPage(30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(`Month ${idx + 1}: ${month.title}`, margin, yPos);
      yPos += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      month.actions.forEach(action => {
        checkNewPage();
        doc.text(`• ${action}`, margin, yPos);
        yPos += 8;
      });
      yPos += 10;
    });
    
    yPos += 15;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(13);
    const insightLines = doc.splitTextToSize(analysis.keyInsight, pageWidth - 2 * margin - 20);
    doc.text(insightLines, pageWidth / 2, yPos, { align: 'center' });

    // Convert to base64
    const pdfBase64 = doc.output('datauristring');

    res.json({
      success: true,
      pdf: pdfBase64,
      filename: `Careera-Leadership-Report-${Date.now()}.pdf`,
      analysis,
    });

  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report',
      details: error.message,
    });
  }
});

// SPA fallback only for app routes (never for files/assets/api)
app.get(/^\/(?!api\/)(?!.*\.).*/, (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
