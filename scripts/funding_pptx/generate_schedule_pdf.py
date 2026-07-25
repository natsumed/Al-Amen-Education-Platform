#!/usr/bin/env python3
"""Generate Arabic (+ French) implementation calendar PDF from funding dossier content."""
from __future__ import annotations

from datetime import datetime
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

import arabic_reshaper
from bidi.algorithm import get_display

OUT_AR = Path("/home/luceor/Documents/Al-Amane_Raznama_Tanfidh_AR.pdf")
OUT_FR = Path("/home/luceor/Documents/Al-Amane_Calendrier_Execution_FR.pdf")
LOG = Path(__file__).with_name("progress.log")

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

# Palette aligned with funding deck
BLUE = colors.HexColor("#1E4FD6")
NAVY = colors.HexColor("#0B1F4D")
PALE = colors.HexColor("#EAF1FE")
GRID = colors.HexColor("#8CA1D6")
WHITE = colors.white
AMBER = colors.HexColor("#F5A623")

# 9 phases — fused from presentation timeline + budget (total 127 000 TND)
# Contingency kept at 3 800 so sum matches dossier total.
PHASES_AR = [
    {
        "n": "1",
        "activity": "الدراسات الفنية وتحليل الاحتياجات، وتصميم الهوية البصرية والشعار والواجهات (UX/UI)",
        "duration": "الشهران 1–2",
        "place": "فريق عمل الدار / مكتب المشروع",
        "outputs": "دراسة احتياجات، هوية بصرية، شعار، نماذج أولية للواجهات",
        "cost": "6 500",
    },
    {
        "n": "2",
        "activity": "تطوير المنصة الإلكترونية (Web) ونظام إدارة المحتوى وقاعدة البيانات",
        "duration": "الأشهر 3–5",
        "place": "فريق تقني",
        "outputs": "منصة ويب ثنائية اللغة، لوحة إدارة، قاعدة بيانات إنتاج",
        "cost": "26 000",
    },
    {
        "n": "3",
        "activity": "تطوير تطبيق Android وتطبيق iOS وربطهما بالمنصة التعليمية (صوت، محتوى تفاعلي، دروس)",
        "duration": "الأشهر 5–8",
        "place": "فريق عمل تقني",
        "outputs": "نسخة رقمية تفاعلية للجوال (Android و iOS)",
        "cost": "20 000",
    },
    {
        "n": "4",
        "activity": "دمج خدمات الذكاء الاصطناعي والمساعد الذكي التربوي داخل المنصة",
        "duration": "الأشهر 5–8",
        "place": "فريق تقني / مختص ذكاء اصطناعي",
        "outputs": "مساعد ذكي للبحث والشرح والمرافقة التربوية",
        "cost": "12 000",
    },
    {
        "n": "5",
        "activity": "رقمنة الكتب والمنشورات الثقافية والتعليمية التابعة لدار أمان الله",
        "duration": "الأشهر 6–10",
        "place": "فريق المحتوى / الدار",
        "outputs": "أكثر من 500 كتاب ومنشور رقمي جاهز للنشر",
        "cost": "12 000",
    },
    {
        "n": "6",
        "activity": "إنتاج الفيديوهات والدروس والوسائط التعليمية، مع تسجيل التعليق الصوتي والمونتاج",
        "duration": "الأشهر 6–10",
        "place": "استوديو / مختص إنتاج سمعي بصري",
        "outputs": "أكثر من 100 درس وفيديو تعليمي جاهز",
        "cost": "20 000",
    },
    {
        "n": "7",
        "activity": "إعداد الخطة التسويقية والإشهار وإطلاق الحملة التواصلية (مدارس، مؤسسات ثقافية، شبكات)",
        "duration": "الأشهر 10–12",
        "place": "فريق تسويق رقمي",
        "outputs": "خطة تسويق، مواد إشهار، حملة إطلاق",
        "cost": "8 000",
    },
    {
        "n": "8",
        "activity": "التدريب والتكوين لفريق العمل، والإدارة والمتابعة والتقييم، والمصاريف القانونية والإدارية",
        "duration": "الأشهر 10–12",
        "place": "مكتب المشروع",
        "outputs": "فريق مكوّن، تقارير متابعة، ملفات قانونية وإدارية",
        "cost": "14 500",
    },
    {
        "n": "9",
        "activity": "إطلاق المنصة الرقمية: استضافة سحابية، اسم النطاق، شهادات الحماية، واحتياطي للمخاطر",
        "duration": "الشهر 12",
        "place": "المنصة الإلكترونية / البنية السحابية",
        "outputs": "الإطلاق الرسمي للمشروع والإعلان عن المنصة",
        "cost": "8 000",
    },
]

PHASES_FR = [
    {
        "n": "1",
        "activity": "Études techniques et analyse des besoins ; identité visuelle, logo et interfaces (UX/UI)",
        "duration": "Mois 1–2",
        "place": "Équipe projet / bureau",
        "outputs": "Étude des besoins, identité visuelle, logo, maquettes UX/UI",
        "cost": "6 500",
    },
    {
        "n": "2",
        "activity": "Développement de la plateforme Web, CMS et base de données",
        "duration": "Mois 3–5",
        "place": "Équipe technique",
        "outputs": "Plateforme web bilingue, back-office, base de production",
        "cost": "26 000",
    },
    {
        "n": "3",
        "activity": "Développement Android et iOS et liaison à la plateforme (audio, contenu interactif, leçons)",
        "duration": "Mois 5–8",
        "place": "Équipe technique",
        "outputs": "Version numérique interactive mobile (Android et iOS)",
        "cost": "20 000",
    },
    {
        "n": "4",
        "activity": "Intégration de l'intelligence artificielle et de l'assistant pédagogique",
        "duration": "Mois 5–8",
        "place": "Équipe technique / spécialiste IA",
        "outputs": "Assistant intelligent (recherche, explications, accompagnement)",
        "cost": "12 000",
    },
    {
        "n": "5",
        "activity": "Numérisation des livres et publications culturelles et éducatives (Éditions Al-Amân)",
        "duration": "Mois 6–10",
        "place": "Équipe contenu / maison d'édition",
        "outputs": "Plus de 500 livres et publications numériques",
        "cost": "12 000",
    },
    {
        "n": "6",
        "activity": "Production des vidéos, leçons et médias ; voix off et montage",
        "duration": "Mois 6–10",
        "place": "Studio / production audiovisuelle",
        "outputs": "Plus de 100 leçons et vidéos éducatives",
        "cost": "20 000",
    },
    {
        "n": "7",
        "activity": "Plan marketing, publicité et campagne de lancement (écoles, institutions, réseaux)",
        "duration": "Mois 10–12",
        "place": "Équipe marketing digital",
        "outputs": "Plan marketing, supports publicitaires, campagne de lancement",
        "cost": "8 000",
    },
    {
        "n": "8",
        "activity": "Formation de l'équipe ; gestion, suivi et évaluation ; frais juridiques et administratifs",
        "duration": "Mois 10–12",
        "place": "Bureau projet",
        "outputs": "Équipe formée, rapports de suivi, dossiers administratifs",
        "cost": "14 500",
    },
    {
        "n": "9",
        "activity": "Lancement digital : hébergement cloud, nom de domaine, certificats SSL, réserve risques",
        "duration": "Mois 12",
        "place": "Plateforme électronique / cloud",
        "outputs": "Lancement officiel et annonce publique de la plateforme",
        "cost": "8 000",
    },
]

TOTAL = "127 000"


def log(msg: str) -> None:
    line = f"{datetime.now().isoformat(timespec='seconds')} {msg}"
    print(line, flush=True)
    try:
        with open(LOG, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except OSError:
        pass


def ar(text: str) -> str:
    """Shape Arabic for correct RTL display in ReportLab."""
    return get_display(arabic_reshaper.reshape(text))


def register_fonts() -> None:
    pdfmetrics.registerFont(TTFont("DejaVu", FONT))
    pdfmetrics.registerFont(TTFont("DejaVuBold", FONT_B))


def make_pdf_ar(path: Path) -> None:
    register_fonts()
    doc = SimpleDocTemplate(
        str(path),
        pagesize=landscape(A4),
        leftMargin=1.2 * cm,
        rightMargin=1.2 * cm,
        topMargin=1.2 * cm,
        bottomMargin=1.2 * cm,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "ARTitle",
        parent=styles["Normal"],
        fontName="DejaVuBold",
        fontSize=16,
        textColor=NAVY,
        alignment=TA_CENTER,
        spaceAfter=4,
        leading=22,
    )
    sub_style = ParagraphStyle(
        "ARSub",
        parent=styles["Normal"],
        fontName="DejaVu",
        fontSize=10,
        textColor=BLUE,
        alignment=TA_CENTER,
        spaceAfter=8,
        leading=14,
    )
    cell = ParagraphStyle(
        "ARCell",
        parent=styles["Normal"],
        fontName="DejaVu",
        fontSize=8,
        leading=11,
        alignment=TA_CENTER,
        textColor=NAVY,
    )
    cell_b = ParagraphStyle(
        "ARCellB",
        parent=styles["Normal"],
        fontName="DejaVuBold",
        fontSize=9,
        leading=12,
        alignment=TA_CENTER,
        textColor=WHITE,
    )
    note_style = ParagraphStyle(
        "ARNote",
        parent=styles["Normal"],
        fontName="DejaVu",
        fontSize=9,
        textColor=NAVY,
        alignment=TA_CENTER,
        leading=12,
    )

    story = []
    story.append(
        Paragraph(
            ar("رزنامة تنفيذ المشروع — إنشاء منصة تعليمية ثقافية رقمية"),
            title_style,
        )
    )
    story.append(
        Paragraph(
            ar("دار أمان الله للنشر والتوزيع  ·  المدة: 12 شهراً  ·  الحالة: قيد التطوير"),
            sub_style,
        )
    )

    # Headers RTL visual order: rightmost first in Arabic reading = we put columns
    # in visual LTR PDF order as: cost | outputs | place | duration | activity | phase
    # so when read RTL it matches the template (phase on the right).
    headers = [
        ar("الثمن د.ت"),
        ar("المخرجات"),
        ar("مكان الإنجاز"),
        ar("المدة"),
        ar("النشاط"),
        ar("المرحلة"),
    ]
    data = [[Paragraph(h, cell_b) for h in headers]]

    for p in PHASES_AR:
        data.append(
            [
                Paragraph(p["cost"], cell),
                Paragraph(ar(p["outputs"]), cell),
                Paragraph(ar(p["place"]), cell),
                Paragraph(ar(p["duration"]), cell),
                Paragraph(ar(p["activity"]), cell),
                Paragraph(p["n"], cell),
            ]
        )

    # Total row
    data.append(
        [
            Paragraph(TOTAL, cell_b),
            Paragraph(ar("إجمالي تكلفة المشروع"), cell_b),
            Paragraph("", cell_b),
            Paragraph(ar("12 شهراً"), cell_b),
            Paragraph(ar("المجموع"), cell_b),
            Paragraph("", cell_b),
        ]
    )

    # Column widths (landscape A4 usable ~27.3 cm)
    col_w = [2.4 * cm, 5.2 * cm, 3.6 * cm, 2.8 * cm, 10.2 * cm, 2.0 * cm]
    table = Table(data, colWidths=col_w, repeatRows=1)
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), BLUE),
        ("BACKGROUND", (0, -1), (-1, -1), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("TEXTCOLOR", (0, -1), (-1, -1), WHITE),
        ("FONTNAME", (0, 0), (-1, -1), "DejaVu"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 0.8, GRID),
        ("BOX", (0, 0), (-1, -1), 1.5, colors.HexColor("#C0392B")),  # red frame like template
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("BACKGROUND", (0, -1), (-1, -1), NAVY),
    ]
    for i in range(1, len(data) - 1):
        if i % 2 == 0:
            style_cmds.append(("BACKGROUND", (0, i), (-1, i), PALE))
        else:
            style_cmds.append(("BACKGROUND", (0, i), (-1, i), WHITE))
    table.setStyle(TableStyle(style_cmds))
    story.append(table)
    story.append(Spacer(1, 8 * mm))
    story.append(
        Paragraph(
            ar(
                "تمويل: مساهمة صاحبة المشروع 27.000 د.ت (21 %)  +  دعم وزارة الشؤون الثقافية 100.000 د.ت (79 %)"
            ),
            note_style,
        )
    )
    story.append(
        Paragraph(
            ar("المصدر: ملف التمويل — منصة أمان الله التعليمية الثقافية الرقمية (Phase 1 قيد التطوير)"),
            note_style,
        )
    )
    doc.build(story)
    log(f"PDF AR written {path} size={path.stat().st_size}")


def make_pdf_fr(path: Path) -> None:
    register_fonts()
    doc = SimpleDocTemplate(
        str(path),
        pagesize=landscape(A4),
        leftMargin=1.2 * cm,
        rightMargin=1.2 * cm,
        topMargin=1.2 * cm,
        bottomMargin=1.2 * cm,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "FRTitle", parent=styles["Normal"], fontName="DejaVuBold", fontSize=15,
        textColor=NAVY, alignment=TA_CENTER, spaceAfter=4, leading=20,
    )
    sub_style = ParagraphStyle(
        "FRSub", parent=styles["Normal"], fontName="DejaVu", fontSize=10,
        textColor=BLUE, alignment=TA_CENTER, spaceAfter=8, leading=14,
    )
    cell = ParagraphStyle(
        "FRCell", parent=styles["Normal"], fontName="DejaVu", fontSize=8,
        leading=11, alignment=TA_CENTER, textColor=NAVY,
    )
    cell_b = ParagraphStyle(
        "FRCellB", parent=styles["Normal"], fontName="DejaVuBold", fontSize=9,
        leading=12, alignment=TA_CENTER, textColor=WHITE,
    )
    note_style = ParagraphStyle(
        "FRNote", parent=styles["Normal"], fontName="DejaVu", fontSize=9,
        textColor=NAVY, alignment=TA_CENTER, leading=12,
    )

    story = []
    story.append(Paragraph("Calendrier d'exécution — Création d'une plateforme éducative culturelle numérique", title_style))
    story.append(Paragraph("Éditions Al-Amân  ·  Durée : 12 mois  ·  Statut : en développement", sub_style))

    headers = ["Étape", "Activité", "Durée", "Lieu d'exécution", "Livrables", "Coût (TND)"]
    data = [[Paragraph(h, cell_b) for h in headers]]
    for p in PHASES_FR:
        data.append([
            Paragraph(p["n"], cell),
            Paragraph(p["activity"], cell),
            Paragraph(p["duration"], cell),
            Paragraph(p["place"], cell),
            Paragraph(p["outputs"], cell),
            Paragraph(p["cost"], cell),
        ])
    data.append([
        Paragraph("", cell_b),
        Paragraph("TOTAL", cell_b),
        Paragraph("12 mois", cell_b),
        Paragraph("", cell_b),
        Paragraph("Coût total du projet", cell_b),
        Paragraph(TOTAL, cell_b),
    ])

    col_w = [1.6 * cm, 10.4 * cm, 2.6 * cm, 3.8 * cm, 5.4 * cm, 2.4 * cm]
    table = Table(data, colWidths=col_w, repeatRows=1)
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), BLUE),
        ("BACKGROUND", (0, -1), (-1, -1), NAVY),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 0.8, GRID),
        ("BOX", (0, 0), (-1, -1), 1.5, colors.HexColor("#C0392B")),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]
    for i in range(1, len(data) - 1):
        style_cmds.append(("BACKGROUND", (0, i), (-1, i), PALE if i % 2 == 0 else WHITE))
    table.setStyle(TableStyle(style_cmds))
    story.append(table)
    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph(
        "Financement : contribution propre 27 000 TND (21 %) + soutien Ministère des Affaires Culturelles 100 000 TND (79 %)",
        note_style,
    ))
    story.append(Paragraph(
        "Source : dossier de financement Al-Amân — Phase 1 en cours de développement",
        note_style,
    ))
    doc.build(story)
    log(f"PDF FR written {path} size={path.stat().st_size}")


def main() -> None:
    log("=== schedule PDF generation start ===")
    # verify budget sum
    costs = [int(p["cost"].replace(" ", "")) for p in PHASES_AR]
    assert sum(costs) == 127000, sum(costs)
    make_pdf_ar(OUT_AR)
    make_pdf_fr(OUT_FR)
    log("=== schedule PDF generation done ===")
    print(f"OK {OUT_AR}")
    print(f"OK {OUT_FR}")


if __name__ == "__main__":
    main()
