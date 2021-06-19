(async () => {
    
    const links = $(".mtg-topic a").toArray().map(e => ({
        href: e.href,
        text: e.text
    }));
    let toDownload = [];
    const parser = new DOMParser();
    for (const link of links) {
        // console.log("link", link);
        const res = await fetch(link.href).then(e => e.text());
        const $_ = parser.parseFromString(res, "text/html");
        const items = [...$_.getElementsByClassName("clips_container")].map(e => e.innerHTML).map(e => parser.parseFromString(e, "text/html")).map(e => ({
            id: e.getElementsByClassName("downloadmeeting")[0].getAttribute("data-id"),
            startTime: e.getElementsByClassName("tobe_downloadclip_starttime")[0].value
        }));
        // console.log("\titems", items);
        for (const item of items) {
            // console.log("\titem", item);
            const token = await fetch("https://zoom.us/csrf_js", {
                "headers": {
                    "fetch-csrf-token": "1",
                },
                "method": "POST",
                "mode": "cors",
                "credentials": "include"
            }).then(e => e.text()).then(e => e.replace("ZOOM-CSRFTOKEN:", ""));
            const res = await fetch(`https://zoom.us/rec/download_meeting/${item.id}?startTime=${item.startTime}`, {
                "method": "POST",
                "mode": "cors",
                "credentials": "include",
                headers: {
                    "zoom-csrftoken": token
                }
            }).then(e => e.json());
            for (let downloadPath of res.result.batchDownloadFileList) {
                var oldName = new URL(downloadPath).pathname.split("/").pop();
                var newName = link.text + " " + new URL(downloadPath).pathname.split("/").pop();
                toDownload.push([newName, downloadPath]);
//                 window.open(downloadPath);
            }
//             await new Promise(resolve => setTimeout(resolve, 20000)); // Wait 20 sec
        }
    }
    console.log(`
# Parallel download files to current directory.
# Code from: https://www.markhneedham.com/blog/2018/07/15/python-parallel-download-files-requests/
import os
import requests
from time import time as timer
from multiprocessing.pool import ThreadPool

urls = ${JSON.stringify(toDownload)}

def fetch_url(entry):
    path, uri = entry
    if not os.path.exists(path):
        r = requests.get(uri, stream=True, headers={'referer': 'https://zoom.us/recording/management', 'cookie': '${document.cookie}'})
        r.raise_for_status()
        if r.status_code == 200:
            with open(path, 'wb') as f:
                for chunk in r:
                    f.write(chunk)
    return path

start = timer()
results = ThreadPool(8).imap_unordered(fetch_url, urls)
for path in results:
    print(path)

print(f"Elapsed Time: {timer() - start}")

`)

})();
