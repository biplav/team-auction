const { mdToPdf } = require('md-to-pdf');
const path = require('path');
const fs = require('fs');

async function generatePDFs() {
  console.log('📄 Generating PDF documents...');

  const docsDir = path.join(__dirname, '..', 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const basePath = path.join(__dirname, '..');

  try {
    // Generate Full Manual PDF
    console.log('📝 Converting Team Owner Manual to PDF...');
    const manualPath = path.join(__dirname, '..', 'TEAM_OWNER_MANUAL.md');
    const manualPdf = await mdToPdf(
      { path: manualPath },
      {
        dest: path.join(docsDir, 'Team_Owner_Manual.pdf'),
        basedir: basePath,
        pdf_options: {
          format: 'A4',
          margin: {
            top: '20mm',
            right: '20mm',
            bottom: '20mm',
            left: '20mm'
          },
          printBackground: true
        },
        stylesheet: path.join(__dirname, 'pdf-styles.css'),
        body_class: 'manual'
      }
    );
    console.log('✅ Team Owner Manual PDF created!');

    // Generate Quick Start Guide PDF
    console.log('📝 Converting Quick Start Guide to PDF...');
    const quickStartPath = path.join(__dirname, '..', 'TEAM_OWNER_QUICK_START.md');
    const quickStartPdf = await mdToPdf(
      { path: quickStartPath },
      {
        dest: path.join(docsDir, 'Team_Owner_Quick_Start.pdf'),
        basedir: basePath,
        pdf_options: {
          format: 'A4',
          margin: {
            top: '20mm',
            right: '20mm',
            bottom: '20mm',
            left: '20mm'
          },
          printBackground: true
        },
        stylesheet: path.join(__dirname, 'pdf-styles.css'),
        body_class: 'quickstart'
      }
    );
    console.log('✅ Quick Start Guide PDF created!');

    // Generate Manual with Images PDF
    console.log('📝 Converting Team Owner Manual with Images to PDF...');
    const manualWithImagesPath = path.join(__dirname, '..', 'TEAM_OWNER_MANUAL_WITH_IMAGES.md');
    const manualWithImagesPdf = await mdToPdf(
      { path: manualWithImagesPath },
      {
        dest: path.join(docsDir, 'Team_Owner_Manual_With_Screenshots.pdf'),
        basedir: basePath,
        pdf_options: {
          format: 'A4',
          margin: {
            top: '20mm',
            right: '20mm',
            bottom: '20mm',
            left: '20mm'
          },
          printBackground: true
        },
        stylesheet: path.join(__dirname, 'pdf-styles.css'),
        body_class: 'manual'
      }
    );
    console.log('✅ Manual with Screenshots PDF created!');

    console.log('\n✨ All PDFs generated successfully!');
    console.log(`📁 Location: ${docsDir}`);
    console.log('\nGenerated files:');
    console.log('  - Team_Owner_Manual.pdf (Complete detailed manual)');
    console.log('  - Team_Owner_Quick_Start.pdf (Quick reference guide)');
    console.log('  - Team_Owner_Manual_With_Screenshots.pdf (Manual with image placeholders)');

  } catch (error) {
    console.error('❌ Error generating PDFs:', error);
    throw error;
  }
}

generatePDFs().catch(console.error);
