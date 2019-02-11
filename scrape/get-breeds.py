import json
import requests
from bs4 import BeautifulSoup

base_url = "https://www.purina.com"
url = "https://www.purina.com/cats/cat-breeds"

def get_content(url):
    page = requests.get(url)
    if not page.ok:
        print("No webpage")
        exit(1)
    return page.content

def get_pages():
    main_page = get_content(url)
    temp_soup = BeautifulSoup(main_page, 'html.parser')

    pages = []
    li = temp_soup.find('nav', attrs={'class':'pagination'}).ul.li
    while li:
        if 'pagination-list-item-link' in li.a['class']:
            pages += [url + '/' + li.a['href']]
        li = li.find_next('li')
    return pages


def add_description(url, breed_data):
    page = get_content(url)
    soup = BeautifulSoup(page, 'html.parser')
    section = soup.find('section', attrs={'class':'mainContent'})
    content = section.find('div', attrs={'class':'statsDef-content'})
    breed_data['breed'] = content.h1.text
    dd = content.find_next('dd')
    while dd:
        key = dd.div.text.lower()
        value = dd.div.find_next_sibling('div').text.strip()
        breed_data[key] = value
        dd = dd.find_next('dd')
    div = section.find('div', attrs={'class':'quarantine'})
    breed_data['description'] = div.p.text
    breed_data['did_you_know'] = div.find_next('div', attrs={'class':'quarantine'}).p.text


def collect_breeds():
    breeds = {}
    for page_url in get_pages():
        page = get_content(page_url)
        soup = BeautifulSoup(page, 'html.parser')
        div = soup.find('div', attrs={'class':'blocks'}).div
        while div:
            breed_id = div.a['href']
            breed_url = base_url + breed_id
            breed_name = div.span.text
            breed_data = {
                'img': base_url + div.div.img['src'],
                'url': breed_url
            }
            add_description(breed_url, breed_data)
            breeds[breed_name] = breed_data
            div = div.find_next_sibling('div')
    return breeds

def save_breeds(breeds):
    with open("cats-db.js", "w") as db:
        json.dump(breeds, db)

breeds = collect_breeds()
save_breeds(breeds)

# breed_data = {}
# add_description("https://www.purina.com/cats/cat-breeds/chartreux", breed_data)
# save_breeds(breed_data)
