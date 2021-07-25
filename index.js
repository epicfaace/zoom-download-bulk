(async () => {
    
    const links = $(".mtg-topic a").toArray().map(e => ({
        href: e.href,
        text: e.text
    }));
    let moveCommands = [];
    const parser = new DOMParser();
    for (const link of links) {
        // console.log("link", link);
        const res = await fetch(link.href.replace("us06web.zoom.us", "zoom.us")).then(e => e.text());
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
                moveCommands.push(`mv "${oldName}" "${newName}"`);
                window.open(downloadPath);
            }
            await new Promise(resolve => setTimeout(resolve, 40000)); // Wait 40 sec
        }
    }
    console.log(moveCommands.join("\n"));

})();
