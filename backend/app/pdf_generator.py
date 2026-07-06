import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.pdfgen import canvas

# Dictionary to collect page numbers dynamically on the first pass
song_pages_cache = {}

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
        self.setFont("Helvetica-Bold", 8)
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
        self.setFont("Helvetica", 7.5)
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
        fontName='Helvetica-Bold',
        fontSize=32,
        leading=38,
        alignment=1, # Centered
        textColor=colors.HexColor("#7c3aed"), # Violet-600
        spaceAfter=15
    )
    
    cover_subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=14,
        leading=18,
        alignment=1,
        textColor=colors.HexColor("#4b5563"), # Gray-600
        spaceAfter=25
    )
    
    cover_meta_style = ParagraphStyle(
        'CoverMeta',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9.5,
        leading=14,
        alignment=1,
        textColor=colors.HexColor("#9ca3af"), # Gray-400
        spaceBefore=180
    )
    
    toc_title_style = ParagraphStyle(
        'TOCTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=colors.HexColor("#111827"), # Gray-900
        spaceAfter=20
    )
    
    toc_row_style = ParagraphStyle(
        'TOCRow',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#374151") # Gray-800
    )
    
    toc_row_bold_style = ParagraphStyle(
        'TOCRowBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#111827") # Gray-900
    )
    
    song_number_style = ParagraphStyle(
        'SongNumber',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=13,
        textColor=colors.HexColor("#7c3aed"), # Violet-600
        spaceAfter=2
    )
    
    song_title_style = ParagraphStyle(
        'SongTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#111827"), # Gray-900
        spaceAfter=6
    )
    
    song_meta_style = ParagraphStyle(
        'SongMeta',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#6b7280"), # Gray-500
        spaceAfter=15
    )
    
    song_lyrics_style = ParagraphStyle(
        'SongLyrics',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=11,
        leading=16.5,
        textColor=colors.HexColor("#1f2937") # Gray-700
    )
    
    song_trans_style = ParagraphStyle(
        'SongTrans',
        parent=styles['Normal'],
        fontName='Times-Italic',
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
            
            toc_data.append([
                Paragraph(title_text, toc_row_style),
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
            
            # Song Label
            story.append(Paragraph(f"SONG {song.number}", song_number_style))
            
            # Title (with custom flowable in first pass to capture layout page)
            if collected_pages is not None:
                story.append(Paragraph(song.title, song_title_style))
            else:
                story.append(SongHeadingParagraph(song.id, song.title, song_title_style, song_pages_cache))
                
            story.append(Paragraph(meta_label, song_meta_style))
            
            # Song Lyrics
            lyrics_html = song.lyrics.replace("\n", "<br/>")
            story.append(Paragraph(lyrics_html, song_lyrics_style))
            
            # Transliteration text if present
            if song.transliteration:
                story.append(Spacer(1, 15))
                story.append(Paragraph("<b>TRANSLITERATION:</b>", ParagraphStyle('TransTitle', parent=song_meta_style, spaceAfter=5)))
                trans_html = song.transliteration.replace("\n", "<br/>")
                story.append(Paragraph(trans_html, song_trans_style))
                
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
