import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const proposalDir = path.join(root, "docs", "proposal");
const diagramsDir = path.join(root, "docs", "diagrams");
const outputPath = path.join(proposalDir, "kitabhoshmand-monograph-proposal.docx");

const images = [
  { key: "dfdContext", file: "kitabhoshmand-dfd-context.webp", title: "Figure 1. Level 0 Data Flow Diagram" },
  { key: "dfdUpload", file: "kitabhoshmand-dfd-upload-library.webp", title: "Figure 2. Level 1A DFD - Upload, Extraction, and Library Search" },
  { key: "dfdVoice", file: "kitabhoshmand-dfd-voice-session.webp", title: "Figure 3. Level 1B DFD - Voice Study Session and Book Search Tool" },
  { key: "erdLogical", file: "kitabhoshmand-erd-logical.webp", title: "Figure 4. Logical Entity Relationship Diagram" },
  { key: "erdPhysical", file: "kitabhoshmand-erd-physical.webp", title: "Figure 5. Physical MongoDB Entity Relationship Diagram" },
];

const TWIPS_PER_INCH = 1440;
const EMU_PER_INCH = 914400;
const PAGE_WIDTH_TWIPS = 11906;
const PAGE_HEIGHT_TWIPS = 16838;
const MARGIN_TWIPS = 1134;
const CONTENT_WIDTH_TWIPS = PAGE_WIDTH_TWIPS - MARGIN_TWIPS * 2;
const CONTENT_WIDTH_EMU = Math.round((CONTENT_WIDTH_TWIPS / TWIPS_PER_INCH) * EMU_PER_INCH);
const MAX_IMAGE_HEIGHT_EMU = Math.round(5.6 * EMU_PER_INCH);

const xml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const paragraph = (text, options = {}) => {
  const {
    style,
    bold = false,
    italic = false,
    size = 24,
    align,
    spacingAfter = 160,
    spacingBefore = 0,
    color,
    pageBreakBefore = false,
  } = options;

  const pPr = [
    style ? `<w:pStyle w:val="${style}"/>` : "",
    align ? `<w:jc w:val="${align}"/>` : "",
    `<w:spacing w:before="${spacingBefore}" w:after="${spacingAfter}" w:line="276" w:lineRule="auto"/>`,
    pageBreakBefore ? "<w:pageBreakBefore/>" : "",
  ].join("");

  const rPr = [
    bold ? "<w:b/>" : "",
    italic ? "<w:i/>" : "",
    color ? `<w:color w:val="${color}"/>` : "",
    `<w:sz w:val="${size}"/>`,
    `<w:szCs w:val="${size}"/>`,
  ].join("");

  return `<w:p><w:pPr>${pPr}</w:pPr><w:r><w:rPr>${rPr}</w:rPr><w:t xml:space="preserve">${xml(text)}</w:t></w:r></w:p>`;
};

const heading = (text, level = 1) =>
  paragraph(text, {
    style: level === 1 ? "Heading1" : "Heading2",
    bold: true,
    size: level === 1 ? 32 : 27,
    spacingBefore: level === 1 ? 300 : 180,
    spacingAfter: 120,
    color: level === 1 ? "1F4E79" : "2F5597",
  });

const bullet = (text) =>
  `<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:spacing w:after="80"/><w:ind w:left="720" w:hanging="360"/></w:pPr><w:r><w:rPr><w:sz w:val="24"/></w:rPr><w:t>• ${xml(text)}</w:t></w:r></w:p>`;

const pageBreak = () => `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;

const table = (headers, rows, widths) => {
  const totalWidth = widths.reduce((sum, width) => sum + width, 0);
  const grid = widths.map((width) => `<w:gridCol w:w="${width}"/>`).join("");
  const rowXml = (cells, isHeader = false) =>
    `<w:tr>${cells
      .map((cell, index) => {
        const shade = isHeader ? '<w:shd w:fill="D9EAF7"/>' : "";
        const bold = isHeader ? "<w:b/>" : "";
        return `<w:tc><w:tcPr><w:tcW w:w="${widths[index]}" w:type="dxa"/>${shade}<w:tcMar><w:top w:w="80" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tcMar></w:tcPr><w:p><w:pPr><w:spacing w:after="60"/></w:pPr><w:r><w:rPr>${bold}<w:sz w:val="22"/></w:rPr><w:t>${xml(cell)}</w:t></w:r></w:p></w:tc>`;
      })
      .join("")}</w:tr>`;

  return `<w:tbl><w:tblPr><w:tblW w:w="${totalWidth}" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="6" w:color="8EAADB"/><w:left w:val="single" w:sz="6" w:color="8EAADB"/><w:bottom w:val="single" w:sz="6" w:color="8EAADB"/><w:right w:val="single" w:sz="6" w:color="8EAADB"/><w:insideH w:val="single" w:sz="4" w:color="B4C6E7"/><w:insideV w:val="single" w:sz="4" w:color="B4C6E7"/></w:tblBorders><w:tblLook w:firstRow="1" w:noHBand="0" w:noVBand="1"/></w:tblPr><w:tblGrid>${grid}</w:tblGrid>${rowXml(headers, true)}${rows.map((row) => rowXml(row)).join("")}</w:tbl>`;
};

const imageParagraph = (image, index) => {
  const rid = `rId${index + 1}`;
  return `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="80"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${image.cx}" cy="${image.cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="${index + 1}" name="${xml(image.title)}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${index + 1}" name="${xml(image.mediaName)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${image.cx}" cy="${image.cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
};

const relationshipText = (image, index) =>
  `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${image.mediaName}"/>`;

const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="24"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:rPr><w:b/><w:color w:val="1F4E79"/><w:sz w:val="32"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:rPr><w:b/><w:color w:val="2F5597"/><w:sz w:val="27"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:uiPriority w:val="34"/><w:qFormat/></w:style>
</w:styles>`;

const contentTypes = (media) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const docRels = (media) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${media.map(relationshipText).join("\n  ")}
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

const proposalContent = (media) => {
  const imageMap = Object.fromEntries(media.map((image, index) => [image.key, imageParagraph(image, index)]));
  const body = [
    paragraph("KitabHoshmand (کتاب هوشمند)", { bold: true, size: 40, align: "center", spacingBefore: 900, spacingAfter: 160, color: "1F4E79" }),
    paragraph("Voice-Native AI Book Companion", { bold: true, size: 30, align: "center", spacingAfter: 500 }),
    paragraph("University Monograph Project Proposal", { size: 28, align: "center", spacingAfter: 600 }),
    table(
      ["Field", "Details"],
      [
        ["Student Name", "[Student Name]"],
        ["Student ID", "[Student ID]"],
        ["Department", "[Department]"],
        ["Supervisor", "[Supervisor Name]"],
        ["University", "[University Name]"],
        ["Submission Date", "[Submission Date]"],
      ],
      [2600, 5200],
    ),
    paragraph("Proposal Section Flow", { bold: true, size: 26, align: "center", spacingBefore: 360, spacingAfter: 160, color: "1F4E79" }),
    table(
      ["Section", "Content Focus"],
      [
        ["1. Introduction", "Executive summary, problem background, objectives, and scope."],
        ["2. Existing System", "Current study workflow and limitations."],
        ["3. Proposed System", "Solution overview, scope of work, modules, risks, and trust signals."],
        ["4. Logical Design", "Data flow design and logical ERD diagrams."],
        ["5. Physical Design", "Deployment view, database collections, storage, and integrations."],
        ["6. Tools and Technologies", "Technology stack, purpose, and justification."],
        ["7. Project Time and Cost Estimation", "Academic cost estimate in USD."],
        ["8. Project Timeline", "Ten-week roadmap and milestones."],
      ],
      [2400, 5400],
    ),
    pageBreak(),
    heading("1. Introduction"),
    heading("Executive Summary", 2),
    paragraph("KitabHoshmand is a university monograph software project designed as a voice-native AI book companion. The system allows users to upload PDF books, extract searchable text, store book segments, browse a smart digital library, and discuss selected books through a real-time voice assistant."),
    paragraph("The project treats academic reading as an interactive workflow rather than a static document-viewing activity. It combines document processing, cloud storage, authentication, database search, and voice interaction to support a practical study experience."),
    heading("Problem Statement and Background", 2),
    paragraph("Students often rely on static PDF files, manual note taking, and basic keyword search when working with academic books. These methods can be slow, fragmented, and difficult to use during review or discussion. A student may need to search through large documents manually, remember page locations, or switch between several tools to understand a topic."),
    paragraph("The background of this project is the need for a more accessible and intelligent study companion that can transform uploaded academic material into searchable and discussable knowledge."),
    heading("Project Objectives", 2),
    bullet("Provide a secure platform for uploading and managing PDF books."),
    bullet("Extract book content and store it as searchable text segments."),
    bullet("Enable users to search and browse a smart book library."),
    bullet("Support real-time voice discussion with a selected book."),
    bullet("Track subscription-style usage limits for books and voice sessions."),
    heading("Scope Summary", 2),
    paragraph("The scope covers the full workflow from authenticated upload to voice-based study. It includes PDF upload, text extraction, metadata storage, searchable book segments, protected book pages, voice assistant integration, transcript display, and plan-based limits."),

    heading("2. Existing System"),
    paragraph("The existing study process is mainly based on manually opening PDF files, reading content page by page, and using limited document search features. In many cases, students also depend on separate note-taking applications, browser searches, or manual summaries."),
    paragraph("This traditional workflow has several limitations. It is static, does not support natural conversation with the material, and provides limited context-aware search. It also lacks centralized tracking of uploaded academic resources and does not provide structured usage or session history for a study process."),
    bullet("Static reading experience with limited interaction."),
    bullet("Basic keyword search without book-aware conversational context."),
    bullet("No real-time voice assistant for asking questions about book content."),
    bullet("No integrated upload, storage, transcript, and usage tracking workflow."),
    bullet("Reduced accessibility for users who benefit from spoken interaction."),

    heading("3. Proposed System"),
    paragraph("The proposed system, KitabHoshmand, is a web-based smart book companion built with Next.js, React, TypeScript, MongoDB, Vercel Blob, Clerk, Vapi, and ElevenLabs voice configuration. The system lets users upload PDF books, extract their text, store the extracted content in searchable segments, and study the material through a real-time voice assistant."),
    heading("Proposed Solution and Scope of Work", 2),
    paragraph("The solution will provide a complete academic book workflow. Users authenticate through Clerk, upload a PDF, optionally upload or generate a cover image, enter book metadata, choose an assistant voice, and create a smart book record. The system stores the PDF and cover in Vercel Blob, stores metadata and text segments in MongoDB, and uses Vapi to enable voice conversations with book-aware search."),
    bullet("Authentication and protected study routes."),
    bullet("PDF upload, parsing, and first-page cover generation."),
    bullet("Book metadata and segment storage in MongoDB."),
    bullet("Library browsing and title or author search."),
    bullet("Voice session start, stop, transcript, duration tracking, and tool calls."),
    bullet("Subscription-style plan limits for books and monthly voice sessions."),
    heading("Risk Assessment and Trust Signals", 2),
    paragraph("The main risks are third-party service configuration, API key management, PDF parsing quality, and voice assistant tool alignment. These risks are reduced by using established services, validating input, isolating protected server actions, storing structured records, and maintaining clear environment-variable requirements."),
    paragraph("Trust signals include typed implementation with TypeScript, schema validation with Zod, authenticated upload handling, indexed MongoDB collections, documented diagrams, and validation through linting, production build, and TypeScript checks."),

    heading("4. Logical Design"),
    paragraph("The logical design describes how users, external services, processes, and data stores interact in the system. The DFD diagrams show the main flow from user interaction to upload, parsing, storage, library search, voice session handling, and book-segment search. The logical ERD shows the main entities and their relationships."),
    imageMap.dfdContext,
    paragraph("Figure 1 shows the context-level data flow between the user, KitabHoshmand, Clerk, Vercel Blob, MongoDB, Vapi, and ElevenLabs.", { italic: true, align: "center", size: 21 }),
    imageMap.dfdUpload,
    paragraph("Figure 2 shows the upload, extraction, and library-search flow.", { italic: true, align: "center", size: 21 }),
    imageMap.dfdVoice,
    paragraph("Figure 3 shows the voice study session and book-search tool flow.", { italic: true, align: "center", size: 21 }),
    imageMap.erdLogical,
    paragraph("Figure 4 shows the logical entity relationships for ClerkUser, Book, BookSegment, and VoiceSession.", { italic: true, align: "center", size: 21 }),

    heading("5. Physical Design"),
    paragraph("The physical design maps the logical system into actual implementation components. The frontend and backend are implemented with Next.js App Router. MongoDB stores book metadata, extracted book segments, and voice session records. Vercel Blob stores uploaded PDF and cover files. Clerk manages authentication and subscription UI. Vapi manages real-time voice sessions and calls the application search endpoint when book content is needed."),
    paragraph("The physical database design contains three main MongoDB collections: books, booksegments, and voicesessions. Each collection includes required fields, optional fields, timestamps, foreign references, and indexes for search or usage tracking."),
    imageMap.erdPhysical,
    paragraph("Figure 5 shows the physical MongoDB model, including field types, nullability, keys, references, indexes, and constraints.", { italic: true, align: "center", size: 21 }),

    heading("6. Tools and Technologies"),
    table(
      ["Tool or Technology", "Purpose", "Justification"],
      [
        ["Next.js 16 App Router", "Routing, API routes, server actions, and deployment structure", "Provides a modern full-stack framework for React applications."],
        ["React 19", "User interface components", "Supports reusable and interactive frontend development."],
        ["TypeScript", "Typed application development", "Reduces implementation errors and improves maintainability."],
        ["Tailwind CSS 4", "Application styling", "Enables consistent and responsive styling."],
        ["Clerk", "Authentication and subscriptions", "Provides secure user identity, protected routes, and pricing UI."],
        ["MongoDB and Mongoose", "Database and schema modeling", "Stores books, text segments, and voice session records."],
        ["Vercel Blob", "PDF and cover image storage", "Stores uploaded files outside the database."],
        ["pdfjs-dist", "PDF text extraction and cover rendering", "Extracts readable text and generates a visual cover preview."],
        ["Vapi", "Real-time voice assistant", "Enables voice conversations and tool calls."],
        ["ElevenLabs through Vapi", "Assistant voice configuration", "Provides natural voice output for study sessions."],
        ["Zod", "Input validation", "Validates form and upload data."],
        ["React Hook Form", "Form state management", "Handles upload form input efficiently."],
      ],
      [2400, 3000, 3600],
    ),

    heading("7. Project Time and Cost Estimation"),
    paragraph("The following estimate is prepared for an academic project context. Labor is calculated at a student project rate of USD 5 per hour. Cloud and API costs are estimated for development, testing, and demonstration usage."),
    table(
      ["Category", "Estimated Hours", "Rate or Basis", "Estimated Cost"],
      [
        ["Requirements, proposal, and documentation", "35", "$5/hour", "$175"],
        ["UI design and frontend implementation", "55", "$5/hour", "$275"],
        ["PDF upload, parsing, and storage workflow", "50", "$5/hour", "$250"],
        ["Database models, search, and API endpoints", "45", "$5/hour", "$225"],
        ["Voice assistant integration and transcript workflow", "50", "$5/hour", "$250"],
        ["Subscription limits and protected flows", "25", "$5/hour", "$125"],
        ["Testing, validation, and final preparation", "20", "$5/hour", "$100"],
        ["Estimated labor subtotal", "280", "Academic estimate", "$1,400"],
        ["Cloud/API/testing allowance", "-", "Development and demo usage", "$120"],
        ["Contingency", "-", "Risk and service variation allowance", "$150"],
        ["Estimated total", "-", "USD", "$1,670"],
      ],
      [3100, 1700, 2600, 1800],
    ),

    heading("8. Project Timeline"),
    table(
      ["Period", "Milestone", "Main Activities", "Deliverable"],
      [
        ["Week 1", "Requirements and proposal", "Define problem, objectives, scope, and proposal document.", "Approved project proposal"],
        ["Week 2", "UI/UX and logical design", "Prepare interface direction, DFD, ERD, and core workflow design.", "Design and diagrams"],
        ["Weeks 3-4", "Upload, parsing, and storage", "Implement PDF upload, Blob storage, text extraction, cover handling, and book creation.", "Working upload pipeline"],
        ["Week 5", "Library and search", "Implement library listing, title and author search, and searchable book segments.", "Smart library module"],
        ["Weeks 6-7", "Voice assistant integration", "Connect Vapi, configure voice settings, implement transcript and book-search tool endpoint.", "Voice study module"],
        ["Week 8", "Subscriptions and usage tracking", "Implement plan limits for books, monthly sessions, and session duration.", "Usage control module"],
        ["Week 9", "Testing and documentation", "Run lint, build, TypeScript checks, and prepare monograph evidence.", "Test evidence and documentation"],
        ["Week 10", "Final review and submission", "Review UI, diagrams, proposal, demo script, and final presentation materials.", "Final monograph submission"],
      ],
      [1400, 2500, 4400, 2200],
    ),
  ].join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" mc:Ignorable="w14 wp14">
  <w:body>
    ${body}
    <w:sectPr><w:pgSz w:w="${PAGE_WIDTH_TWIPS}" w:h="${PAGE_HEIGHT_TWIPS}"/><w:pgMar w:top="${MARGIN_TWIPS}" w:right="${MARGIN_TWIPS}" w:bottom="${MARGIN_TWIPS}" w:left="${MARGIN_TWIPS}" w:header="708" w:footer="708" w:gutter="0"/><w:cols w:space="708"/><w:docGrid w:linePitch="360"/></w:sectPr>
  </w:body>
</w:document>`;
};

const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i += 1) {
  let c = i;
  for (let j = 0; j < 8; j += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[i] = c >>> 0;
}

const crc32 = (buffer) => {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};

const dosDateTime = (date = new Date()) => {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, date: dosDate };
};

const createZip = (entries) => {
  const chunks = [];
  const central = [];
  let offset = 0;
  const stamp = dosDateTime();

  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const data = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data, "utf8");
    const crc = crc32(data);
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(stamp.time, 10);
    local.writeUInt16LE(stamp.date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    name.copy(local, 30);
    chunks.push(local, data);

    const header = Buffer.alloc(46 + name.length);
    header.writeUInt32LE(0x02014b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(20, 6);
    header.writeUInt16LE(0, 8);
    header.writeUInt16LE(0, 10);
    header.writeUInt16LE(stamp.time, 12);
    header.writeUInt16LE(stamp.date, 14);
    header.writeUInt32LE(crc, 16);
    header.writeUInt32LE(data.length, 20);
    header.writeUInt32LE(data.length, 24);
    header.writeUInt16LE(name.length, 28);
    header.writeUInt16LE(0, 30);
    header.writeUInt16LE(0, 32);
    header.writeUInt16LE(0, 34);
    header.writeUInt16LE(0, 36);
    header.writeUInt32LE(0, 38);
    header.writeUInt32LE(offset, 42);
    name.copy(header, 46);
    central.push(header);
    offset += local.length + data.length;
  }

  const centralSize = central.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...chunks, ...central, end]);
};

const loadMedia = async () => {
  const media = [];
  for (const [index, image] of images.entries()) {
    const source = path.join(diagramsDir, image.file);
    const png = await sharp(source).png().toBuffer();
    const metadata = await sharp(png).metadata();
    const aspect = metadata.height / metadata.width;
    let cx = CONTENT_WIDTH_EMU;
    let cy = Math.round(cx * aspect);
    if (cy > MAX_IMAGE_HEIGHT_EMU) {
      cy = MAX_IMAGE_HEIGHT_EMU;
      cx = Math.round(cy / aspect);
    }
    media.push({
      ...image,
      mediaName: `diagram-${index + 1}.png`,
      data: png,
      cx,
      cy,
    });
  }
  return media;
};

const main = async () => {
  const media = await loadMedia();
  const entries = [
    { name: "[Content_Types].xml", data: contentTypes(media) },
    { name: "_rels/.rels", data: rootRels },
    { name: "word/document.xml", data: proposalContent(media) },
    { name: "word/styles.xml", data: stylesXml },
    { name: "word/_rels/document.xml.rels", data: docRels(media) },
    ...media.map((image) => ({ name: `word/media/${image.mediaName}`, data: image.data })),
  ];

  await fs.writeFile(outputPath, createZip(entries));
  console.log(outputPath);
};

await main();
