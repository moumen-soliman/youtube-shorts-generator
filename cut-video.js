const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const whisper = require('whisper');

app.use(cors());
app.use(bodyParser.json());

const downloadFolder = path.join(__dirname, 'downloads');
const outputFolder = path.join(__dirname, 'outputs');

// Ensure folders exist
if (!fs.existsSync(downloadFolder)) fs.mkdirSync(downloadFolder);
if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder);

// Endpoint to cut video
app.post('/cut-video', async (req, res) => {
  const { youtubeUrl, startTime, duration } = req.body;

  if (!youtubeUrl || startTime === undefined || duration === undefined) {
    return res.status(400).send({ message: 'Missing required parameters.' });
  }

  const videoId = youtubeUrl.split('v=')[1]?.split('&')[0];
  if (!videoId) {
    return res.status(400).send({ message: 'Invalid YouTube URL.' });
  }

  const videoPath = path.join(downloadFolder, `${videoId}.mp4`);
  const outputPath = path.join(outputFolder, `${videoId}_short.mp4`);
  let logs = [];

  try {
    // Step 1: Download video
    logs.push('Starting video download...');
    await new Promise((resolve, reject) => {
      const command = `yt-dlp -o "${videoPath}" -f best "${youtubeUrl}"`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          logs.push(stderr || stdout);
          return reject(new Error('Failed to download video.'));
        }
        logs.push(stdout);
        resolve();
      });
    });

    // Step 2: Cut video
    logs.push('Starting video cutting...');
    await new Promise((resolve, reject) => {
      const command = `ffmpeg -i "${videoPath}" -ss ${startTime} -t ${duration} -c copy "${outputPath}"`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          logs.push(stderr || stdout);
          return reject(new Error('Failed to cut video.'));
        }
        logs.push(stdout);
        resolve();
      });
    });

    // Step 3: Send the output file
    logs.push('Processing completed.');
    res.setHeader('X-Logs', encodeURIComponent(JSON.stringify(logs)));
    res.download(outputPath, `${videoId}_short.mp4`, () => {
      fs.unlinkSync(videoPath);
      fs.unlinkSync(outputPath);
    });
  } catch (error) {
    logs.push(`Error: ${error.message}`);
    res.status(500).send({ message: 'An error occurred.', logs });
  }
});

const execWithLogs = (command, logs, timeout = 60000) =>
  new Promise((resolve, reject) => {
    const process = exec(command, { timeout }, (error, stdout, stderr) => {
      logs.push(`Command: ${command}`);
      if (stdout) logs.push(`STDOUT: ${stdout}`);
      if (stderr) logs.push(`STDERR: ${stderr}`);
      if (error) return reject(new Error(stderr || stdout || error.message));
      resolve(stdout);
    });
  });

  app.post('/create-portrait-video', async (req, res) => {
    const { youtubeUrl, startTime, duration } = req.body;
  
    if (!youtubeUrl || startTime === undefined || duration === undefined) {
      return res.status(400).send({ message: 'Missing required parameters.' });
    }
  
    const videoId = youtubeUrl.split('v=')[1]?.split('&')[0];
    if (!videoId) {
      return res.status(400).send({ message: 'Invalid YouTube URL.' });
    }
  
    const downloadFolder = path.join(__dirname, 'downloads');
    const outputFolder = path.join(__dirname, 'outputs');
    const entertainmentVideoPath = path.join(__dirname, 'entertainment_video.mp4'); // Replace with valid path
    const cutVideoPath = path.join(outputFolder, `${videoId}_cut.mp4`);
    const finalOutputPath = path.join(outputFolder, `${videoId}_portrait.mp4`);
    let logs = [];
    let downloadedFilePath = null;
  
    try {
      // Step 1: Check if the file already exists
      downloadedFilePath = path.join(downloadFolder, `${videoId}.webm`);
      if (fs.existsSync(downloadedFilePath)) {
        logs.push('File already exists in downloads. Using the existing file.');
      } else {
        // Step 2: Download the video
        logs.push('Starting video download...');
        const downloadCommand = `yt-dlp -o "${downloadFolder}/${videoId}.%(ext)s" -f "bestvideo+bestaudio/best" "${youtubeUrl}"`;
        await execWithLogs(downloadCommand, logs);
        logs.push('Video downloaded successfully.');
  
        // Ensure the downloaded file exists
        if (!fs.existsSync(downloadedFilePath)) {
          throw new Error('YouTube video download failed.');
        }
      }
  
      // Step 3: Cut the YouTube video
      logs.push('Starting video cutting...');
      const cutCommand = `ffmpeg -i "${downloadedFilePath}" -ss ${startTime} -t ${duration} -c copy "${cutVideoPath}"`;
      await execWithLogs(cutCommand, logs);
      logs.push('Video cutting completed.');
  
      if (!fs.existsSync(cutVideoPath)) {
        throw new Error('Cut video file not created.');
      }
  
      // Step 4: Combine videos into portrait layout
      logs.push('Starting video combination into portrait layout...');
      const combineCommand = `
        ffmpeg \
        -i "${cutVideoPath}" \
        -i "${entertainmentVideoPath}" \
        -filter_complex "[0:v:0]scale=640:360[vid1];[1:v:0]scale=640:360[vid2];[vid1][vid2]vstack=inputs=2" \
        -c:v libx264 -crf 23 -preset veryfast \
        -c:a aac -strict experimental \
        "${finalOutputPath}"`;
      await execWithLogs(combineCommand, logs);
      logs.push('Video combination completed.');
  
      if (!fs.existsSync(finalOutputPath)) {
        throw new Error('Portrait video file not created.');
      }
  
      // Step 5: Send the final video
      logs.push('Sending the final video...');
      res.setHeader('X-Logs', encodeURIComponent(JSON.stringify(logs)));
      res.download(finalOutputPath, `${videoId}_portrait.mp4`, () => {
        fs.unlinkSync(cutVideoPath);
        fs.unlinkSync(finalOutputPath);
      });
    } catch (error) {
      logs.push(`Error: ${error.message}`);
      res.status(500).send({ message: 'An error occurred.', logs });
    }
  });
  


// Endpoint to process video and add text
app.post('/add-text-video', async (req, res) => {
    const { youtubeUrl, startTime, duration } = req.body;
  
    if (!youtubeUrl || startTime === undefined || duration === undefined) {
      return res.status(400).send({ message: 'Missing required parameters.' });
    }
  
    const videoId = youtubeUrl.split('v=')[1]?.split('&')[0];
    if (!videoId) {
      return res.status(400).send({ message: 'Invalid YouTube URL.' });
    }
  
    const videoPath = path.join(downloadFolder, `${videoId}.mp4`);
    const outputPath = path.join(outputFolder, `${videoId}_with_text.mp4`);
    const audioPath = path.join(outputFolder, `${videoId}.wav`);
    const transcriptionPath = path.join(outputFolder, `${videoId}_transcription.json`);
    let logs = [];
  
    try {
      // Step 1: Download the video
      if (!fs.existsSync(videoPath)) {
        logs.push('Starting video download...');
        const downloadCommand = `yt-dlp -o "${videoPath}" -f best "${youtubeUrl}"`;
        await execWithLogs(downloadCommand, logs);
      } else {
        logs.push('Video already exists. Using the existing file.');
      }
  
      // Step 2: Extract audio from the video
      logs.push('Extracting audio from the video...');
      const audioCommand = `ffmpeg -i "${videoPath}" -q:a 0 -map a "${audioPath}"`;
      await execWithLogs(audioCommand, logs);
  
      // Step 3: Transcribe audio
      logs.push('Transcribing audio...');
      const model = whisper.load_model('base');
      const transcription = model.transcribe(audioPath);
      fs.writeFileSync(transcriptionPath, JSON.stringify(transcription));
      logs.push('Transcription completed.');
  
      // Step 4: Generate FFmpeg overlay filter
      logs.push('Generating overlay filter...');
      const segments = transcription.segments;
      const drawTextFilters = segments
        .map(
          (segment) =>
            `drawtext=enable='between(t,${segment.start},${segment.end})':text='${segment.text.replace(
              /'/g,
              "\\'"
            )}':x=(w-text_w)/2:y=h-50:fontsize=24:fontcolor=yellow`
        )
        .join(',');
  
      // Step 5: Add text to video
      logs.push('Adding text to video...');
      const overlayCommand = `ffmpeg -i "${videoPath}" -vf "${drawTextFilters}" -c:v libx264 -crf 23 -preset veryfast -c:a copy "${outputPath}"`;
      await execWithLogs(overlayCommand, logs);
  
      logs.push('Text added to video successfully.');
  
      // Step 6: Send the output file
      res.setHeader('X-Logs', encodeURIComponent(JSON.stringify(logs)));
      res.download(outputPath, `${videoId}_with_text.mp4`, () => {
        fs.unlinkSync(audioPath);
        fs.unlinkSync(transcriptionPath);
      });
    } catch (error) {
      logs.push(`Error: ${error.message}`);
      res.status(500).send({ message: 'An error occurred.', logs });
    }
  });
  
  
  

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Ensure yt-dlp and FFmpeg are installed and available in PATH.');
});