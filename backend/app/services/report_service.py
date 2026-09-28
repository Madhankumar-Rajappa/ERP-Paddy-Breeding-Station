import io
import csv
from datetime import datetime, timezone
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_pdf_report(title: str, plot_data: Dict[str, Any], trial_data: Dict[str, Any], observations: List[Dict[str, Any]], harvest_data: List[Dict[str, Any]]) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], fontSize=18, textColor=colors.HexColor('#1b4332'), spaceAfter=10)
    subtitle_style = ParagraphStyle('SubTitleStyle', parent=styles['Heading2'], fontSize=13, textColor=colors.HexColor('#2d6a4f'), spaceBefore=10, spaceAfter=6)
    body_style = ParagraphStyle('BodyStyle', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor('#212529'), spaceAfter=4)
    
    current_date = datetime.now().strftime("%Y-%m-%d %H:%M")
    # Header
    story.append(Paragraph("PADDY BREEDING STATION - EXPERIMENTAL REPORT", title_style))
    story.append(Paragraph(f"Report: {title} | Generated Date: {current_date}", body_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#1b4332'), spaceAfter=12))
    
    # Plot Details Section
    story.append(Paragraph("1. Plot Master Details", subtitle_style))
    plot_table_data = [
        ["Plot ID", plot_data.get("plot_code", "E4A"), "Plot Name", plot_data.get("name", "Plot E4A")],
        ["North Boundary", f"{plot_data.get('north_length_m', 36.0)} m", "South Boundary", f"{plot_data.get('south_length_m', 34.8)} m"],
        ["East Boundary", f"{plot_data.get('east_length_m', 30.0)} m", "West Boundary", f"{plot_data.get('west_length_m', 31.2)} m"],
        ["Additional Field", f"{plot_data.get('additional_measurement_value', 80)} {plot_data.get('additional_measurement_unit', 'cm')}", "Status", plot_data.get("status", "Planted")]
    ]
    t1 = Table(plot_table_data, colWidths=[120, 140, 120, 140])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8f9fa')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#dee2e6')),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#212529')),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t1)
    story.append(Spacer(1, 12))
    
    # Trial Details Section
    if trial_data:
        story.append(Paragraph("2. Active Breeding Trial Information", subtitle_style))
        trial_table_data = [
            ["Trial ID", trial_data.get("trial_code", "N/A"), "Trial Name", trial_data.get("name", "N/A")],
            ["Design Type", trial_data.get("design_type", "RBD"), "Season / Year", f"{trial_data.get('season', 'Kharif')} {trial_data.get('year', 2026)}"],
            ["Entries Count", str(trial_data.get("num_entries", 0)), "Replications", str(trial_data.get("num_replications", 0))]
        ]
        t2 = Table(trial_table_data, colWidths=[120, 140, 120, 140])
        t2.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#e9ecef')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#ced4da')),
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
            ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(t2)
        story.append(Spacer(1, 12))
        
    # Observations Summary Section
    if observations:
        story.append(Paragraph("3. Field Observation Summary", subtitle_style))
        obs_rows = [["Date", "Trait", "Recorded Value", "Unit", "Recorded By"]]
        for obs in observations[:10]: # limit to top 10 for clean display
            obs_rows.append([
                obs.get("observation_date", ""),
                obs.get("trait_name", "Trait"),
                str(obs.get("value", 0)),
                obs.get("unit", ""),
                obs.get("recorded_by", "")
            ])
        t3 = Table(obs_rows, colWidths=[90, 140, 100, 80, 110])
        t3.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#2d6a4f')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#ced4da')),
            ('PADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(t3)
        story.append(Spacer(1, 12))
        
    # Harvest Summary Section
    if harvest_data:
        story.append(Paragraph("4. Harvest Yield & Grain Analysis", subtitle_style))
        h_rows = [["Variety", "Replication", "Harvest Date", "Yield (kg/plot)", "Grain Wt (g)", "Moisture %"]]
        for h in harvest_data[:10]:
            h_rows.append([
                h.get("variety_name", "Variety"),
                str(h.get("replication", 1)),
                h.get("harvest_date", ""),
                str(h.get("yield_value", 0)),
                str(h.get("grain_weight", "-")),
                f"{h.get('moisture_percentage', '-')}%"
            ])
        t4 = Table(h_rows, colWidths=[120, 70, 90, 90, 80, 70])
        t4.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#52b788')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#ced4da')),
            ('PADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(t4)
        
    doc.build(story)
    return buffer.getvalue()

def generate_csv_report(headers: List[str], data_rows: List[List[Any]]) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    for row in data_rows:
        writer.writerow(row)
    return output.getvalue()
