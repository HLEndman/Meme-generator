import omggif from 'omggif';
import GIF from 'gif.js';
import axios from 'axios';

var gifRender = async function (gifInfo) {

    var createCanvasContext = function (width, height) {
        let canvas = document.createElement('canvas');
        [canvas.width, canvas.height] = [width, height]
        let ctx = canvas.getContext('2d');
        ctx.font = "16px 'Microsoft YaHei', sans-serif"
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.fillStyle = 'white'
        ctx.strokeStyle = 'black'
        ctx.lineWidth = 3
        ctx.lineJoin = 'round'
        return [canvas, ctx]
    }
    var response = await axios.get(gifInfo.gif, {
        responseType: 'arraybuffer',
        onDownloadProgress: event => {
            // console.log([event.total, event.loaded])
        }
    })
    var arrayBufferView = new Uint8Array(response.data);
    var gifReader = new omggif.GifReader(arrayBufferView),
        frame0info = gifReader.frameInfo(0),
        [width, height] = [frame0info.width, frame0info.height],
        [, ctx] = createCanvasContext(width, height),
        gif = new GIF({
            workerScript: '/gif.worker.js',
            workers: 3,
            quality: 10,
            width: width,
            height: height
        }),
        pixelBuffer = new Uint8ClampedArray(width * height * 4),
        textIndex = 0,
        time = 0,
        captions = document.querySelectorAll('.input.is-info.sentence');
    console.log('nums', gifReader.numFrames())

    for (let i = 0; i < gifReader.numFrames(); i++) {

        gifReader.decodeAndBlitFrameRGBA(i, pixelBuffer);
        let imageData = new window.ImageData(pixelBuffer, width, height)
        ctx.putImageData(imageData, 0, 0);

        let frameInfo = gifReader.frameInfo(i);
        if (textIndex < gifInfo.config.length) {
            var textInfo = gifInfo.config[textIndex];
            if (textInfo.startTime <= time && time <= textInfo.endTime) {
                var text = undefined;
                console.log('cap' + captions);
                if (captions[textIndex])
                    text = captions[textIndex].value || textInfo.default;
                else
                    text = textInfo.default;
                console.log(2 + text);
                ctx.strokeText(text, width / 2, height - 5, width);
                ctx.fillText(text, width / 2, height - 5, width);
                console.log('time' + frameInfo.delay / 100)
            }
            time += frameInfo.delay / 100;
            if (time > textInfo.endTime) {
                textIndex++;
            }
        }
        gif.addFrame(ctx, {
            copy: true,
            delay: frameInfo.delay * 10,
            dispose: frameInfo.dispose
        })
    }
    gif.render()
    gif.on('finished', blob => {
        document.querySelector('#success-notification').style.display = 'block';
        var img = document.querySelector('#gifMeme');
        window.gifUrl = window.URL.createObjectURL(blob);
        img.src = window.gifUrl;
    })
}

var download = function (gifInfo) {
    if (!window.gifUrl)
        gifRender(gifInfo)
    let a = document.createElement('a');
    a.href = window.gifUrl;
    console.log(window.gifUrl)
    a.download = 'meme.gif';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

export { gifRender, download };