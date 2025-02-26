# YouTube Shorts Generator

A web application that allows you to create various types of short-form videos from YouTube content. This tool provides multiple video processing options including simple cuts, portrait mode videos (similar to TikTok/Reels format), and videos with auto-generated subtitles.

[Watch the video](./example.mov)

## Features

- **Video Cutting**: Extract specific segments from YouTube videos
- **Portrait Mode**: Convert landscape videos to portrait format (9:16 aspect ratio)
- **Auto Subtitles**: Add automatically generated subtitles to videos using Whisper AI
- **User-friendly Interface**: Simple web interface for easy video processing
- **Multiple Output Formats**: Choose between different video processing options

## Prerequisites

Before running this application, make sure you have the following installed:

- Node.js (v14 or higher)
- FFmpeg
- yt-dlp
- Python (for Whisper AI functionality)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/moumen-soliman/youtube-shorts-generator.git
cd youtube-shorts-generator
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Install Python dependencies (for Whisper):
```bash
pip install whisper
```

## Configuration

1. Create the required directories:
```bash
mkdir downloads outputs
```

2. For portrait mode videos, you'll need to provide an entertainment video file:
   - Place your background video in the project root directory
   - Update the `entertainmentVideoPath` variable in `cut-video.js`

## Usage

1. Start the server:
```bash
node cut-video.js
```

2. Open `index.html` in your web browser

3. Enter the following information:
   - YouTube URL
   - Start time (in seconds)
   - Duration (in seconds)
   - Select the desired video type:
     - Cut Video: Simple segment extraction
     - Portrait Video: Creates vertical format video
     - Text Video: Adds auto-generated subtitles

4. Click "Generate and Download" to process the video

## API Endpoints

The server provides three main endpoints:

- `/cut-video`: Extracts a segment from a YouTube video
- `/create-portrait-video`: Creates a portrait mode video
- `/add-text-video`: Generates a video with subtitles (IN PROGRESS)

## Technical Details

- Backend: Express.js
- Video Processing: FFmpeg
- YouTube Download: yt-dlp
- Speech Recognition: Whisper AI
- Frontend: HTML/JavaScript

## Security Considerations

- The application handles file operations locally
- Temporary files are automatically cleaned up after processing
- Input validation is implemented for all endpoints

## Limitations

- Video processing time depends on the length of the video and selected options
- Whisper AI subtitle generation requires significant CPU resources
- Portrait mode requires a pre-existing entertainment video file

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- FFmpeg for video processing
- yt-dlp for YouTube video downloading
- OpenAI's Whisper for speech recognition
