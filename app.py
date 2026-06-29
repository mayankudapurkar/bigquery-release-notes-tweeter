import os
import re
import xml.etree.ElementTree as ET
import requests
from flask import Flask, jsonify, render_template
from bs4 import BeautifulSoup

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def fetch_and_parse_feed():
    try:
        response = requests.get(FEED_URL, timeout=10)
        response.raise_for_status()
    except Exception as e:
        # Return a custom error description
        raise RuntimeError(f"Error fetching BigQuery release notes: {str(e)}")

    try:
        root = ET.fromstring(response.content)
    except Exception as e:
        raise RuntimeError(f"Error parsing XML feed: {str(e)}")

    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    entries = []

    for entry in root.findall('atom:entry', ns):
        # Title of the entry is typically the date, e.g. "June 25, 2026"
        title_elem = entry.find('atom:title', ns)
        title = title_elem.text.strip() if title_elem is not None else "Unknown Date"

        id_elem = entry.find('atom:id', ns)
        entry_id = id_elem.text.strip() if id_elem is not None else ""

        updated_elem = entry.find('atom:updated', ns)
        updated = updated_elem.text.strip() if updated_elem is not None else ""

        link_elem = entry.find('atom:link', ns)
        link = link_elem.attrib.get('href', '').strip() if link_elem is not None else ""

        content_elem = entry.find('atom:content', ns)
        content_html = content_elem.text or ""

        # Parse content and split by h3/h4 types
        soup = BeautifulSoup(content_html, 'html.parser')
        sub_updates = []
        current_type = "Update"
        current_html_parts = []

        for child in soup.children:
            if child.name in ['h3', 'h4', 'h2']:
                # Save the accumulated content before switching types
                if current_html_parts:
                    sub_html = "".join(str(x) for x in current_html_parts)
                    plain_text = BeautifulSoup(sub_html, 'html.parser').get_text(separator=' ').strip()
                    plain_text = re.sub(r'\s+', ' ', plain_text)
                    sub_updates.append({
                        'type': current_type,
                        'content_html': sub_html,
                        'plain_text': plain_text
                    })
                    current_html_parts = []
                current_type = child.get_text().strip()
            elif child.name is not None:
                current_html_parts.append(child)

        # Append final sub-update
        if current_html_parts:
            sub_html = "".join(str(x) for x in current_html_parts)
            plain_text = BeautifulSoup(sub_html, 'html.parser').get_text(separator=' ').strip()
            plain_text = re.sub(r'\s+', ' ', plain_text)
            sub_updates.append({
                'type': current_type,
                'content_html': sub_html,
                'plain_text': plain_text
            })

        # If no h3 parsing occurred but HTML content is not empty, use the whole content
        if not sub_updates and content_html.strip():
            plain_text = BeautifulSoup(content_html, 'html.parser').get_text(separator=' ').strip()
            plain_text = re.sub(r'\s+', ' ', plain_text)
            sub_updates.append({
                'type': 'Update',
                'content_html': content_html,
                'plain_text': plain_text
            })

        entries.append({
            'title': title,
            'id': entry_id,
            'updated': updated,
            'link': link,
            'updates': sub_updates
        })

    return entries

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/feed')
def get_feed():
    try:
        feed_data = fetch_and_parse_feed()
        return jsonify({
            'success': True,
            'data': feed_data
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
