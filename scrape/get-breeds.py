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

    description = ''
    div = section.find('div', attrs={'class':'quarantine'})
    p = div.p
    while p:
        description += p.text.strip()
        p = p.find_next_sibling()
    breed_data['description'] = description

    did_you_know = ''
    div = div.find_next('div', attrs={'class':'quarantine'})
    if div.p.strong:
        p = div.p
        while p:
            key = p.text.lower().strip()
            p = p.find_next_sibling()
            value = ''
            while True:
                value += p.text.strip()
                p = p.find_next_sibling()
                if not p or p.strong:
                    break
            if key in ['characteristics', 'history', 'facts']:
                did_you_know += value
            elif key in ['lifespan', 'colors', 'shedding', 'health']:
                breed_data[key] = value
    else:
        did_you_know = div.p.text.strip()
    breed_data['did_you_know'] = did_you_know


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
    with open("cats-db.json", "w") as db:
        json.dump(breeds, db, indent=2)

def load_breeds():
    with open("cats-db.json", "r") as read_file:
        return json.load(read_file)

## Fix 'Did you know?' section: parse extra paragraphs
# breeds = load_breeds()
# for breed_name, breed_data in breeds.items():
#     if 'Lifespan' in breed_data['did_you_know']:
#         print(breed_data['url'])
#         add_description(breed_data['url'], breed_data)
#         breeds[breed_name] = breed_data
#
# save_breeds(breeds)

## Main procedure
breeds = collect_breeds()
save_breeds(breeds)

## Small part for tests
# breed_data = {}
# add_description("https://www.purina.com/cats/cat-breeds/chartreux", breed_data)
# save_breeds(breed_data)
