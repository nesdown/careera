import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import axios from 'axios';
import pdfMake from 'pdfmake/build/pdfmake.js';
import pdfFonts from 'pdfmake/build/vfs_fonts.js';
import dotenv from 'dotenv';

dotenv.config();
pdfMake.vfs = pdfFonts.pdfMake.vfs;

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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
        timeout: 10000,
      }
    );
    
    if (response.data && response.data.imageUrl) {
      const imageResponse = await axios.get(response.data.imageUrl, { 
        responseType: 'arraybuffer',
        timeout: 10000 
      });
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

    // Step 3: Create beautiful PDF with pdfmake
    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      defaultStyle: {
        font: 'Helvetica',
      },
      header: (currentPage) => {
        if (currentPage === 1) return null;
        return {
          text: 'Careera Leadership Report',
          alignment: 'center',
          margin: [0, 20, 0, 0],
          color: '#666',
          fontSize: 9,
        };
      },
      footer: (currentPage, pageCount) => {
        return {
          columns: [
            {
              text: `Page ${currentPage} of ${pageCount}`,
              alignment: 'center',
              fontSize: 9,
              color: '#999',
            },
          ],
          margin: [0, 0, 0, 20],
        };
      },
      content: [
        // Cover Page
        {
          text: 'From Manager to Respected Leader',
          style: 'title',
          margin: [0, 80, 0, 10],
        },
        {
          text: 'Personalized Leadership Growth Report',
          style: 'subtitle',
          margin: [0, 0, 0, 40],
        },
        {
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: '#000' }],
          margin: [0, 0, 0, 40],
        },
        {
          columns: [
            { text: 'Assessment Date:', style: 'label', width: 120 },
            { text: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), style: 'value' },
          ],
          margin: [0, 0, 0, 10],
        },
        {
          columns: [
            { text: 'Leadership Stage:', style: 'label', width: 120 },
            { text: analysis.leadershipStage, style: 'value' },
          ],
          margin: [0, 0, 0, 40],
        },
        {
          text: 'Leadership isn\'t a promotion. It\'s a transition.',
          style: 'quote',
          margin: [40, 20, 40, 0],
        },
        { text: '', pageBreak: 'after' },

        // Executive Summary
        { text: 'Executive Summary', style: 'sectionTitle', pageBreak: 'before' },
        {
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: 100, y2: 0, lineWidth: 3, lineColor: '#000' }],
          margin: [0, 5, 0, 20],
        },
        {
          text: `Leadership Readiness Score: ${analysis.leadershipScore} / 100`,
          style: 'scoreTitle',
          margin: [0, 0, 0, 20],
        },
        {
          text: analysis.executiveSummary,
          style: 'body',
          margin: [0, 0, 0, 30],
        },
        illustrations[0] ? {
          image: illustrations[0],
          width: 400,
          alignment: 'center',
          margin: [0, 20, 0, 0],
        } : {},

        // Competencies
        { text: 'Leadership Competency Breakdown', style: 'sectionTitle', pageBreak: 'before' },
        {
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: 100, y2: 0, lineWidth: 3, lineColor: '#000' }],
          margin: [0, 5, 0, 30],
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', 80, 100],
            body: [
              [
                { text: 'Competency', style: 'tableHeader' },
                { text: 'Score', style: 'tableHeader', alignment: 'center' },
                { text: 'Level', style: 'tableHeader', alignment: 'center' },
              ],
              ...analysis.competencies.map(comp => [
                { text: comp.name, style: 'tableCell' },
                { text: comp.score.toString(), style: 'tableCell', alignment: 'center', bold: true },
                { text: comp.level, style: 'tableCell', alignment: 'center' },
              ]),
            ],
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 0,
            hLineColor: () => '#E5E5E5',
            paddingTop: () => 12,
            paddingBottom: () => 12,
          },
        },

        // Archetype
        { text: `Your Leadership Archetype: ${analysis.archetype.name}`, style: 'sectionTitle', pageBreak: 'before' },
        {
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: 100, y2: 0, lineWidth: 3, lineColor: '#000' }],
          margin: [0, 5, 0, 30],
        },
        {
          ul: analysis.archetype.traits.map(trait => ({ text: trait, style: 'listItem' })),
          margin: [0, 0, 0, 30],
        },

        // Growth Areas
        { text: 'Top 3 Growth Areas', style: 'sectionTitle', pageBreak: 'before' },
        {
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: 100, y2: 0, lineWidth: 3, lineColor: '#000' }],
          margin: [0, 5, 0, 30],
        },
        ...analysis.topGrowthAreas.map((area, idx) => [
          {
            text: `${idx + 1}. ${area.title}`,
            style: 'growthTitle',
            margin: [0, 0, 0, 8],
          },
          {
            text: area.description,
            style: 'body',
            margin: [0, 0, 0, 20],
          },
        ]).flat(),

        // 90-Day Roadmap
        { text: '90-Day Leadership Roadmap', style: 'sectionTitle', pageBreak: 'before' },
        {
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: 100, y2: 0, lineWidth: 3, lineColor: '#000' }],
          margin: [0, 5, 0, 30],
        },
        {
          text: `Month 1: ${analysis.roadmap.month1.title}`,
          style: 'monthTitle',
          margin: [0, 0, 0, 10],
        },
        {
          ul: analysis.roadmap.month1.actions.map(action => ({ text: action, style: 'listItem' })),
          margin: [0, 0, 0, 25],
        },
        {
          text: `Month 2: ${analysis.roadmap.month2.title}`,
          style: 'monthTitle',
          margin: [0, 0, 0, 10],
        },
        {
          ul: analysis.roadmap.month2.actions.map(action => ({ text: action, style: 'listItem' })),
          margin: [0, 0, 0, 25],
        },
        {
          text: `Month 3: ${analysis.roadmap.month3.title}`,
          style: 'monthTitle',
          margin: [0, 0, 0, 10],
        },
        {
          ul: analysis.roadmap.month3.actions.map(action => ({ text: action, style: 'listItem' })),
          margin: [0, 0, 0, 35],
        },
        illustrations[2] ? {
          image: illustrations[2],
          width: 450,
          alignment: 'center',
          margin: [0, 20, 0, 30],
        } : {},
        {
          text: analysis.keyInsight,
          style: 'quote',
          margin: [40, 20, 40, 0],
        },
      ],
      styles: {
        title: {
          fontSize: 28,
          bold: true,
          alignment: 'center',
          color: '#000',
        },
        subtitle: {
          fontSize: 18,
          alignment: 'center',
          color: '#555',
        },
        sectionTitle: {
          fontSize: 20,
          bold: true,
          color: '#000',
          margin: [0, 0, 0, 10],
        },
        scoreTitle: {
          fontSize: 16,
          bold: true,
          color: '#000',
        },
        body: {
          fontSize: 11,
          lineHeight: 1.6,
          color: '#333',
        },
        label: {
          fontSize: 11,
          color: '#666',
        },
        value: {
          fontSize: 11,
          bold: true,
          color: '#000',
        },
        quote: {
          fontSize: 13,
          italics: true,
          alignment: 'center',
          color: '#666',
        },
        tableHeader: {
          fontSize: 11,
          bold: true,
          color: '#000',
          fillColor: '#F5F5F5',
        },
        tableCell: {
          fontSize: 11,
          color: '#333',
        },
        listItem: {
          fontSize: 11,
          lineHeight: 1.5,
          color: '#333',
        },
        growthTitle: {
          fontSize: 14,
          bold: true,
          color: '#000',
        },
        monthTitle: {
          fontSize: 13,
          bold: true,
          color: '#000',
        },
      },
    };

    // Generate PDF
    const pdfDoc = pdfMake.createPdf(docDefinition);
    
    pdfDoc.getBase64((data) => {
      res.json({
        success: true,
        pdf: `data:application/pdf;base64,${data}`,
        filename: `Careera-Leadership-Report-${Date.now()}.pdf`,
        analysis,
      });
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

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
