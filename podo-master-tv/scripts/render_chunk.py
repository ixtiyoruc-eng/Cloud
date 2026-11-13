import sys, asyncio, subprocess
from playwright.async_api import async_playwright
a,b,fps,out=float(sys.argv[1]),float(sys.argv[2]),int(sys.argv[3]),sys.argv[4]
n=round((b-a)*fps)
async def main():
    ff=subprocess.Popen(['ffmpeg','-loglevel','error','-y','-f','image2pipe','-framerate',str(fps),'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','veryfast','-crf','16','-pix_fmt','yuv420p','-r',str(fps),'-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709',out+'.tmp.mp4'],stdin=subprocess.PIPE)
    async with async_playwright() as p:
        br=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        pg=await br.new_page(viewport={'width':1920,'height':1080})
        await pg.goto('file:///home/claude/tv/v2.html'); await pg.wait_for_timeout(800)
        for i in range(n):
            await pg.evaluate(f'(async()=>{{render({a+i/fps}); await window.vidReady;}})()')
            ff.stdin.write(await pg.screenshot(type='jpeg',quality=92))
        await br.close()
    ff.stdin.close(); r=ff.wait()
    if r==0:
        import os; os.replace(out+'.tmp.mp4',out)
asyncio.run(main())
