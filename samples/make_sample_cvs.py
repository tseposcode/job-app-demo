"""Make the three made-up demo CVs in samples/cvs/.

Run: python3 samples/make_sample_cvs.py   (needs: pip install reportlab)

These people are fictional. Phone numbers use 000 and emails use example.com,
so they can never reach a real person. Keep the headings (LOOKING FOR, EDUCATION,
SKILLS, EXPERIENCE) and the "Label: value" lines: the app's CV reader looks for them.
"""

from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

OUT = Path(__file__).parent / 'cvs'
INK = HexColor('#142019')
MUTED = HexColor('#5B6A60')
ACCENT = HexColor('#0F6B4F')

PEOPLE = [
    {
        'file': 'Lerato_Mokoena_CV.pdf',
        'name': 'Lerato Mokoena',
        'contact': 'Johannesburg, Gauteng  |  071 000 1234  |  lerato.mokoena@example.com',
        'profile': 'Computer Science graduate who likes turning messy data into clear dashboards. '
        'Looking for a first role in data or software where I can keep learning.',
        'looking': [
            'Job types: Graduate programme, Internship, Entry-level job',
            'Fields: Data and analytics, IT and software',
            'Locations: Gauteng, Remote',
            'Minimum pay: R8 000 per month',
        ],
        'education': [
            'BSc Computer Science, University of the Witwatersrand, 2025',
            'Highest qualification: Degree',
            'National Senior Certificate, Soweto High School, 2021',
        ],
        'skills': 'Python, SQL, JavaScript, Power BI, Excel, Git, Statistics',
        'experience': [
            'Data intern, Ubuntu Retail Group (made-up company), Jun 2025 - Dec 2025',
            '- Built weekly sales dashboards in Power BI for 12 stores.',
            '- Cleaned and joined stock data with SQL and Python.',
            'Volunteer coding tutor, Code Club Soweto, 2023 - 2025',
        ],
    },
    {
        'file': 'Sipho_Ndlovu_CV.pdf',
        'name': 'Sipho Ndlovu',
        'contact': 'Durban, KwaZulu-Natal  |  072 000 5678  |  sipho.ndlovu@example.com',
        'profile': 'Logistics diploma graduate with warehouse experience. Organised, reliable '
        'and happy to work shifts. Ready to relocate for the right opportunity.',
        'looking': [
            'Job types: Entry-level job, Learnership, Internship',
            'Fields: Supply chain',
            'Locations: KwaZulu-Natal, Gauteng, Eastern Cape',
            'Minimum pay: R6 000 per month',
        ],
        'education': [
            'National Diploma in Logistics, Durban University of Technology, 2024',
            'Highest qualification: Diploma',
            'National Senior Certificate, Umlazi Comprehensive, 2020',
        ],
        'skills': 'Excel, Procurement, Stock control, Scheduling, Communication, SAP basics',
        'experience': [
            'Warehouse assistant, Coastal Packaging (made-up company), Feb 2025 - present',
            '- Counted and reconciled stock for 400 product lines each month.',
            '- Scheduled outgoing deliveries with three transport companies.',
            'Packer (part-time), Berea Spar, 2021 - 2023',
        ],
    },
    {
        'file': 'Aisha_Petersen_CV.pdf',
        'name': 'Aisha Petersen',
        'contact': 'Cape Town, Western Cape  |  073 000 9012  |  aisha.petersen@example.com',
        'profile': 'Accounting graduate with a strong eye for detail. Comfortable with month-end '
        'work and explaining numbers to people who are not accountants.',
        'looking': [
            'Job types: Graduate programme, Entry-level job, Internship',
            'Fields: Finance and accounting, Admin and customer service',
            'Locations: Western Cape, Gauteng, KwaZulu-Natal, Remote',
            'Minimum pay: R8 500 per month',
        ],
        'education': [
            'BCom Accounting, University of Cape Town, 2025',
            'Highest qualification: Degree',
            'National Senior Certificate, Rondebosch High School, 2021',
        ],
        'skills': 'Excel, Pastel, Reconciliations, Payroll, Financial analysis, Communication',
        'experience': [
            'Vacation work, Table Bay Accountants (made-up company), Dec 2024 - Feb 2025',
            '- Prepared bank and creditor reconciliations for small business clients.',
            '- Helped run payroll for 35 staff.',
            'Student assistant, UCT Commerce Faculty, 2023 - 2025',
        ],
    },
]


def draw_cv(person):
    path = OUT / person['file']
    c = canvas.Canvas(str(path), pagesize=A4)
    c.setTitle(f"{person['name']} CV (sample)")
    c.setAuthor('Job Auto demo')
    width, height = A4
    x = 56
    y = height - 70

    c.setFillColor(INK)
    c.setFont('Helvetica-Bold', 24)
    c.drawString(x, y, person['name'])
    y -= 22
    c.setFont('Helvetica', 10)
    c.setFillColor(MUTED)
    c.drawString(x, y, person['contact'])
    y -= 14
    c.setFont('Helvetica-Oblique', 8)
    c.drawString(x, y, 'Sample CV for a Job Auto demo. This person is made up.')
    y -= 26

    def heading(title):
        nonlocal y
        c.setFillColor(ACCENT)
        c.setFont('Helvetica-Bold', 11)
        c.drawString(x, y, title)
        y -= 5
        c.setStrokeColor(ACCENT)
        c.setLineWidth(0.6)
        c.line(x, y, width - x, y)
        y -= 15

    def lines(items, size=10):
        nonlocal y
        c.setFillColor(INK)
        c.setFont('Helvetica', size)
        for item in items:
            c.drawString(x + (10 if item.startswith('-') else 0), y, item)
            y -= 15
        y -= 10

    def paragraph(text, size=10, max_chars=95):
        words, line, out = text.split(), '', []
        for w in words:
            if len(line) + len(w) + 1 > max_chars:
                out.append(line)
                line = w
            else:
                line = f'{line} {w}'.strip()
        out.append(line)
        lines(out, size)

    heading('PROFILE')
    paragraph(person['profile'])
    heading('LOOKING FOR')
    lines(person['looking'])
    heading('EDUCATION')
    lines(person['education'])
    heading('SKILLS')
    lines([person['skills']])
    heading('EXPERIENCE')
    lines(person['experience'])
    c.showPage()
    c.save()
    return path


if __name__ == '__main__':
    OUT.mkdir(exist_ok=True)
    for p in PEOPLE:
        print('made', draw_cv(p))
