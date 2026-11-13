import sys, asyncio
from playwright.async_api import async_playwright
PAGE=__import__('os').environ.get('PAGE','index.html')
async def main():
    ts=[float(x) for x in sys.argv[1:]]
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        pg=await b.new_page(viewport={'width':1920,'height':1080})
        await pg.goto('file:///home/claude/tv/'+PAGE); await pg.wait_for_timeout(500)
        for t in ts:
            await pg.evaluate(f'(async()=>{{render({t}); await window.vidReady;}})()')
            await pg.screenshot(path=f'/home/claude/tv/test/f_{t:05.1f}.jpg',type='jpeg',quality=80)
        await b.close()
asyncio.run(main())
