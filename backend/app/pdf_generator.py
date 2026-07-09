import io
import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Dictionary to collect page numbers dynamically on the first pass
song_pages_cache = {}

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

FONT_CANDIDATES = {
    "regular": [
        os.getenv("SONGBOOK_PDF_FONT_REGULAR"),
        os.path.join(BASE_DIR, "fonts", "NotoSans-Regular.ttf"),
        r"C:\Windows\Fonts\Nirmala.ttc",
        "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ],
    "bold": [
        os.getenv("SONGBOOK_PDF_FONT_BOLD"),
        os.path.join(BASE_DIR, "fonts", "NotoSans-Bold.ttf"),
        r"C:\Windows\Fonts\NirmalaB.ttf",
        r"C:\Windows\Fonts\Nirmala.ttc",
        "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ],
    "italic": [
        os.getenv("SONGBOOK_PDF_FONT_ITALIC"),
        os.path.join(BASE_DIR, "fonts", "NotoSans-Italic.ttf"),
        "/usr/share/fonts/truetype/noto/NotoSans-Italic.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf",
    ],
}

SCRIPT_FONT_CANDIDATES = {
    "malayalam": {
        "regular": [
            os.getenv("SONGBOOK_PDF_MALAYALAM_FONT_REGULAR"),
            os.path.join(BASE_DIR, "fonts", "NotoSansMalayalam-Regular.ttf"),
            r"C:\Windows\Fonts\Nirmala.ttc",
            "/usr/share/fonts/truetype/noto/NotoSansMalayalam-Regular.ttf",
        ],
        "bold": [
            os.getenv("SONGBOOK_PDF_MALAYALAM_FONT_BOLD"),
            os.path.join(BASE_DIR, "fonts", "NotoSansMalayalam-Bold.ttf"),
            r"C:\Windows\Fonts\NirmalaB.ttf",
            r"C:\Windows\Fonts\Nirmala.ttc",
            "/usr/share/fonts/truetype/noto/NotoSansMalayalam-Bold.ttf",
        ],
    },
    "devanagari": {
        "regular": [
            os.getenv("SONGBOOK_PDF_DEVANAGARI_FONT_REGULAR"),
            os.path.join(BASE_DIR, "fonts", "NotoSansDevanagari-Regular.ttf"),
            r"C:\Windows\Fonts\Nirmala.ttc",
            "/usr/share/fonts/truetype/noto/NotoSansDevanagari-Regular.ttf",
        ],
        "bold": [
            os.getenv("SONGBOOK_PDF_DEVANAGARI_FONT_BOLD"),
            os.path.join(BASE_DIR, "fonts", "NotoSansDevanagari-Bold.ttf"),
            r"C:\Windows\Fonts\NirmalaB.ttf",
            r"C:\Windows\Fonts\Nirmala.ttc",
            "/usr/share/fonts/truetype/noto/NotoSansDevanagari-Bold.ttf",
        ],
    },
    "tamil": {
        "regular": [
            os.getenv("SONGBOOK_PDF_TAMIL_FONT_REGULAR"),
            os.path.join(BASE_DIR, "fonts", "NotoSansTamil-Regular.ttf"),
            r"C:\Windows\Fonts\Nirmala.ttc",
            "/usr/share/fonts/truetype/noto/NotoSansTamil-Regular.ttf",
        ],
        "bold": [
            os.getenv("SONGBOOK_PDF_TAMIL_FONT_BOLD"),
            os.path.join(BASE_DIR, "fonts", "NotoSansTamil-Bold.ttf"),
            r"C:\Windows\Fonts\NirmalaB.ttf",
            r"C:\Windows\Fonts\Nirmala.ttc",
            "/usr/share/fonts/truetype/noto/NotoSansTamil-Bold.ttf",
        ],
    },
}


def _register_first_available_font(name: str, candidates: list[str | None], fallback: str) -> str:
    for path in candidates:
        if path and os.path.exists(path):
            try:
                subfont_index = 0 if path.lower().endswith((".ttc", ".otc")) else 0
                pdfmetrics.registerFont(TTFont(name, path, subfontIndex=subfont_index, shapable=True))
                return name
            except Exception:
                continue
    return fallback


PDF_FONT_REGULAR = _register_first_available_font("SongbookUnicode", FONT_CANDIDATES["regular"], "Helvetica")
PDF_FONT_BOLD = _register_first_available_font("SongbookUnicodeBold", FONT_CANDIDATES["bold"], "Helvetica-Bold")
PDF_FONT_ITALIC = _register_first_available_font("SongbookUnicodeItalic", FONT_CANDIDATES["italic"], PDF_FONT_REGULAR)

SCRIPT_FONTS = {
    script: {
        "regular": _register_first_available_font(
            f"Songbook{script.title()}",
            candidates["regular"],
            PDF_FONT_REGULAR,
        ),
        "bold": _register_first_available_font(
            f"Songbook{script.title()}Bold",
            candidates["bold"],
            PDF_FONT_BOLD,
        ),
    }
    for script, candidates in SCRIPT_FONT_CANDIDATES.items()
}

SCRIPT_RANGES = (
    ("devanagari", range(0x0900, 0x0980)),
    ("tamil", range(0x0B80, 0x0C00)),
    ("malayalam", range(0x0D00, 0x0D80)),
)


def _detect_script(text: str | None) -> str | None:
    for char in text or "":
        codepoint = ord(char)
        for script, codepoints in SCRIPT_RANGES:
            if codepoint in codepoints:
                return script
    return None


def _font_for_text(text: str | None, bold: bool = False, italic: bool = False) -> str:
    script = _detect_script(text)
    if script:
        return SCRIPT_FONTS[script]["bold" if bold else "regular"]
    if bold:
        return PDF_FONT_BOLD
    if italic:
        return PDF_FONT_ITALIC
    return PDF_FONT_REGULAR


def _style_for_text(base_style: ParagraphStyle, text: str | None, bold: bool = False, italic: bool = False) -> ParagraphStyle:
    font_name = _font_for_text(text, bold=bold, italic=italic)
    if font_name == base_style.fontName:
        return base_style
    return ParagraphStyle(f"{base_style.name}-{font_name}", parent=base_style, fontName=font_name)

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas layout drawing running headers, footers, 
    and dynamic page number markers (Page X of Y) on A4 canvas.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        # Cache page details for second-pass rendering
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_elements(num_pages)
            super().showPage()
        super().save()

    def draw_page_elements(self, page_count):
        # Suppress elements on the Cover Page (Page 1)
        if self._pageNumber == 1:
            return
            
        self.saveState()
        self.setFont(PDF_FONT_BOLD, 8)
        self.setFillColor(colors.HexColor("#4b5563")) # Gray-600
        
        # Running Header Text
        self.drawString(54, 790, "CHOIR HYMNAL SONGBOOK")
        
        # Running Header Divider Line
        self.setStrokeColor(colors.HexColor("#e5e7eb")) # Gray-200
        self.setLineWidth(0.5)
        self.line(54, 782, 541, 782)
        
        # Running Footer Divider Line
        self.line(54, 55, 541, 55)
        
        # Running Footer Text
        self.setFont(PDF_FONT_REGULAR, 7.5)
        self.drawString(54, 42, "Choir Songbook Web App | Printable PDF Version")
        
        # Dynamic Page Number
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(541, 42, page_text)
        
        self.restoreState()

class SongHeadingParagraph(Paragraph):
    """
    Custom Paragraph subclass that hooks into ReportLab's flowable 
    drawing sequence to capture the absolute page number of a song heading.
    """
    def __init__(self, song_id, text, style, page_tracker_dict):
        super().__init__(text, style)
        self.song_id = song_id
        self.page_tracker_dict = page_tracker_dict
        
    def draw(self):
        super().draw()
        # Capture current page number from the canvas
        self.page_tracker_dict[self.song_id] = self.canv._pageNumber

def generate_songbook_pdf(songs) -> io.BytesIO:
    """
    Generates a beautifully structured PDF songbook including cover, Table of Contents,
    sequential numbering, categories, serif lyrics, and dynamic footer page numbering.
    Utilizes a two-pass render scheme to guarantee exact page references.
    """
    global song_pages_cache
    song_pages_cache.clear()
    
    # 1. Setup Document Template
    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        pdf_buffer,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    # 2. Setup Styles
    styles = getSampleStyleSheet()
    
    cover_title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName=PDF_FONT_BOLD,
        fontSize=32,
        leading=38,
        alignment=1, # Centered
        textColor=colors.HexColor("#7c3aed"), # Violet-600
        spaceAfter=15
    )
    
    cover_subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName=PDF_FONT_REGULAR,
        fontSize=14,
        leading=18,
        alignment=1,
        textColor=colors.HexColor("#4b5563"), # Gray-600
        spaceAfter=25
    )
    
    cover_meta_style = ParagraphStyle(
        'CoverMeta',
        parent=styles['Normal'],
        fontName=PDF_FONT_ITALIC,
        fontSize=9.5,
        leading=14,
        alignment=1,
        textColor=colors.HexColor("#9ca3af"), # Gray-400
        spaceBefore=180
    )
    
    toc_title_style = ParagraphStyle(
        'TOCTitle',
        parent=styles['Normal'],
        fontName=PDF_FONT_BOLD,
        fontSize=22,
        leading=26,
        textColor=colors.HexColor("#111827"), # Gray-900
        spaceAfter=20
    )
    
    toc_row_style = ParagraphStyle(
        'TOCRow',
        parent=styles['Normal'],
        fontName=PDF_FONT_REGULAR,
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#374151") # Gray-800
    )
    
    toc_row_bold_style = ParagraphStyle(
        'TOCRowBold',
        parent=styles['Normal'],
        fontName=PDF_FONT_BOLD,
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#111827") # Gray-900
    )
    
    song_number_style = ParagraphStyle(
        'SongNumber',
        parent=styles['Normal'],
        fontName=PDF_FONT_BOLD,
        fontSize=11,
        leading=13,
        textColor=colors.HexColor("#7c3aed"), # Violet-600
        spaceAfter=2
    )
    
    song_title_style = ParagraphStyle(
        'SongTitle',
        parent=styles['Normal'],
        fontName=PDF_FONT_BOLD,
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#111827"), # Gray-900
        spaceAfter=6
    )
    
    song_meta_style = ParagraphStyle(
        'SongMeta',
        parent=styles['Normal'],
        fontName=PDF_FONT_BOLD,
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#6b7280"), # Gray-500
        spaceAfter=15
    )
    
    song_lyrics_style = ParagraphStyle(
        'SongLyrics',
        parent=styles['Normal'],
        fontName=PDF_FONT_REGULAR,
        fontSize=11,
        leading=16.5,
        textColor=colors.HexColor("#1f2937") # Gray-700
    )
    
    song_trans_style = ParagraphStyle(
        'SongTrans',
        parent=styles['Normal'],
        fontName=PDF_FONT_ITALIC,
        fontSize=10,
        leading=14.5,
        textColor=colors.HexColor("#4b5563") # Gray-600
    )

    # 3. Helper to assemble document story flow
    def build_story_flow(collected_pages=None):
        story = []
        
        # --- Cover Page ---
        story.append(Spacer(1, 140))
        story.append(Paragraph("CHOIR HYMNAL", cover_title_style))
        story.append(Paragraph("Worship & Praise Reference Songbook", cover_subtitle_style))
        
        # Accent horizontal rule
        rule_data = [[""]]
        rule_table = Table(rule_data, colWidths=[150])
        rule_table.setStyle(TableStyle([
            ('LINEBELOW', (0,0), (-1,-1), 2.5, colors.HexColor("#7c3aed")),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 0),
        ]))
        story.append(rule_table)
        
        meta_html = f"Compiled: {datetime.now().strftime('%B %Y')}<br/>Active Song Catalog: {len(songs)} Songs"
        story.append(Paragraph(meta_html, cover_meta_style))
        story.append(PageBreak())
        
        # --- Table of Contents Page ---
        story.append(Paragraph("Table of Contents", toc_title_style))
        
        toc_data = []
        # Header Row
        toc_data.append([
            Paragraph("<b>Song title</b>", toc_row_bold_style),
            "",
            Paragraph("<b>Page</b>", toc_row_bold_style)
        ])
        
        for song in songs:
            # Fetch absolute starting page from the collected pages dictionary, or default placeholder
            page_val = str(collected_pages.get(song.id, "99")) if collected_pages else "99"
            title_text = f"<b>{song.number}.</b> {song.title}"
            dots = ". " * 32
            toc_song_style = _style_for_text(toc_row_style, song.title)
            
            toc_data.append([
                Paragraph(title_text, toc_song_style),
                Paragraph(dots, ParagraphStyle('dots', parent=toc_row_style, textColor=colors.HexColor("#d1d5db"), alignment=1)),
                Paragraph(page_val, ParagraphStyle('page', parent=toc_row_bold_style, alignment=2))
            ])
            
        toc_table = Table(toc_data, colWidths=[210, 220, 50])
        toc_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4.5),
            ('TOPPADDING', (0,0), (-1,-1), 4.5),
            ('LINEBELOW', (0,0), (-1,0), 1, colors.HexColor("#e5e7eb")),
        ]))
        story.append(toc_table)
        story.append(PageBreak())
        
        # --- Individual Songs ---
        for song in songs:
            # Categories & Languages meta string
            meta_tokens = []
            if song.categories:
                cats = [c.name for c in song.categories]
                meta_tokens.append(f"Categories: {', '.join(cats)}")
            if song.languages:
                langs = [l.name for l in song.languages]
                meta_tokens.append(f"Languages: {', '.join(langs)}")
            meta_label = " | ".join(meta_tokens).upper()
            title_style = _style_for_text(song_title_style, song.title, bold=True)
            meta_style = _style_for_text(song_meta_style, meta_label, bold=True)
            lyrics_style = _style_for_text(song_lyrics_style, song.lyrics)
            
            # Song Label
            story.append(Paragraph(f"SONG {song.number}", song_number_style))
            
            # Title (with custom flowable in first pass to capture layout page)
            if collected_pages is not None:
                story.append(Paragraph(song.title, title_style))
            else:
                story.append(SongHeadingParagraph(song.id, song.title, title_style, song_pages_cache))
                
            story.append(Paragraph(meta_label, meta_style))
            
            # Song Lyrics
            lyrics_html = song.lyrics.replace("\n", "<br/>")
            story.append(Paragraph(lyrics_html, lyrics_style))
            
            # Transliteration text if present
            if song.transliteration:
                trans_style = _style_for_text(song_trans_style, song.transliteration, italic=True)
                story.append(Spacer(1, 15))
                story.append(Paragraph("<b>TRANSLITERATION:</b>", ParagraphStyle('TransTitle', parent=song_meta_style, spaceAfter=5)))
                trans_html = song.transliteration.replace("\n", "<br/>")
                story.append(Paragraph(trans_html, trans_style))
                
            story.append(PageBreak())
            
        return story

    # --- Pass 1: Build doc to capture exact page numbers for each song ---
    pass1_buffer = io.BytesIO()
    doc_temp = SimpleDocTemplate(pass1_buffer, pagesize=A4, leftMargin=54, rightMargin=54, topMargin=54, bottomMargin=54)
    story_pass1 = build_story_flow(collected_pages=None)
    doc_temp.build(story_pass1, canvasmaker=NumberedCanvas)
    
    # --- Pass 2: Re-build using actual page mapping populated in Pass 1 ---
    story_pass2 = build_story_flow(collected_pages=song_pages_cache)
    doc.build(story_pass2, canvasmaker=NumberedCanvas)
    
    # 4. Return complete byte stream
    pdf_buffer.seek(0)
    return pdf_buffer
