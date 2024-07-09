import React, { useState, useRef } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";

function App() {
  const [loaded, setLoaded] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const ffmpegRef = useRef(new FFmpeg());
  const messageRef = useRef<HTMLParagraphElement | null>(null);

  const load = async () => {
    const baseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm";
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on("log", ({ message }) => {
      if (messageRef.current) messageRef.current.innerHTML = message;
    });
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
      workerURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.worker.js`,
        "text/javascript"
      ),
    });
    setLoaded(true);
  };

  const extractAudio = async () => {
    if (!videoFile) {
      alert("Please select an MP4 file first");
      return;
    }

    const ffmpeg = ffmpegRef.current;
    await ffmpeg.writeFile("input.mp4", await fetchFile(videoFile));

    await ffmpeg.exec([
      "-i",
      "input.mp4",
      "-vn",
      "-acodec",
      "libmp3lame",
      "-q:a",
      "2",
      "output.mp3",
    ]);

    const data = await ffmpeg.readFile("output.mp3");
    const audioBlob = new Blob([data], { type: "audio/mp3" });
    const audioUrl = URL.createObjectURL(audioBlob);

    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = "extracted_audio.mp3";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type === "video/mp4") {
        setVideoFile(file);
      } else {
        alert("Please select an MP4 file.");
        event.target.value = "";
      }
    }
  };

  return (
    <div>
      <h1>MP4 Audio Extractor</h1>
      {!loaded ? (
        <button onClick={load}>Load FFmpeg</button>
      ) : (
        <>
          <input type="file" accept="video/mp4" onChange={handleFileChange} />
          <br />
          <button onClick={extractAudio} disabled={!videoFile}>
            Extract Audio
          </button>
          <p ref={messageRef}></p>
        </>
      )}
    </div>
  );
}

export default App;
