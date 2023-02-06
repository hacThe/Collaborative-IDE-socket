<h1>Col-E</h3>

[![tag](https://img.shields.io/badge/-collaborative-69a13d)](https://github.com/hacThe/Collaborative-IDE-socket)
[![tag](https://img.shields.io/badge/-code%20editor-7b4091)](https://github.com/hacThe/Collaborative-IDE-socket)
[![language](https://img.shields.io/badge/-reactjs-75c7eb)](https://github.com/hacThe/Collaborative-IDE-socket)
[![framework](https://img.shields.io/badge/-javascript-ffe387)](https://github.com/hacThe/Collaborative-IDE-socket)
[![framework](https://img.shields.io/badge/-nodejs-57915b)](https://github.com/hacThe/Collaborative-IDE-socket)

[![school](https://img.shields.io/badge/school-UIT-3f6cb6)](https://www.uit.edu.vn/)
[![contributors](https://img.shields.io/badge/contributors-3-1d9583)](#team)

<br>

<p align="center">
 <img src="./info/banner.png" alt="Col-E Logo" minHeight="200"></a>
</p>

This is an online code editor that allows you to write, compile and execute your code online in many programming languages collaboratively with your teammates, and colleagues.

When coding together, you and your teammates can also communicate with each other via messaging and video calling.

You can try Col-E [here](https://colaborative-ide-socket.web.app/).

---

## 📝 Table of Contents

- [Getting Started](#getting-started)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Team](#team)
- [Future Development](#future-development)
- [License](#license)

## Getting Started

To get started, run [Col-E server](https://github.com/tungTLT/collaborative-ide-backend), then run `npm install` and `npm start`.

## Features

### Create/Join Room

Users can create a room where others can join or users can join an existing room created by another user.

To create a room or join a room, users must enter a username, and this name must not be the same as those already in the room in case the user chooses to join the room.

Users can also edit video call settings before joining the room. The actions that can be performed are:

- Turn on/off the camera.
- Turn on/off the microphone.

### Code Editor

While in a code room, users can write and execute shared code in the room with other features that enhance the user experience such as:

- Autocompletion.
- Syntax highlighting: displaying different colors according to keywords and symbols of each language.
- Displaying users' cursor.
- Displaying users' selection.

Users can switch between the following supported languages along with the corresponding code templates for each language:

- Java
- C
- C++
- Python
- Golang
- C#
- Swift
- Dart
- JavaScript
- Kotlin

### Chat

Users in the same room can communicate with each other by message through chat channels.

When a new message arrives, an indicator will appear on the icon of the chat channel to notify the user that there is a new unread message.

### Video Call

A video call will be made as soon as the room is created. Users can turn the camera or the microphone on/off before and after creating a room/joining a room.

In addition, users can drag and drop to move the video call display element within the limit of the frame.

### User Color

Each user who joins the room has a unique color available in the system, if the number of colors available in the system is exceeded, the user will carry the default color.
This color corresponds to the color of each element associated with the user in the code room:

- Cursor color displayed on code editor.
- The selected area color is displayed in the code editor.
- Color name on chat channel.
- Avatar background color on video call display in case the camera is not open.

Users can also change their color in the settings if the color they want to change has not been selected by someone else in the room.

## Tech Stack

- ReactJs
- NodeJs
- Socket.IO
- Redis.

## Team

**Col-E** is developed by:

- Trần Lê Thanh Tùng _(TungTLT)_: 19522496@gm.uit.edu.vn
- Dương Hiển Thế _(hacThe)_: 19522252@gm.uit.edu.vn
- Trương Kim Lâm _(ltk84)_: 19521743@gm.uit.edu.vn

<br/>

<h4 align="center">
<a href="https://github.com/hacThe/Collaborative-IDE-socket/graphs/contributors">
<img src="https://contrib.rocks/image?repo=hacThe/Collaborative-IDE-socket" />
</a>

_Made with [contrib.rocks](https://contrib.rocks)._ </h4>

<br/>

## Future Development

**Enhanced code editor:** allows compiling and running multiple code files together, supports debugging; also provides saving, exporting files, and opening files from the device.

**Enhanced support for mobile devices:** provide a more user-friendly interface for devices that are small.

**Enhanced security:** implement security measures to detect and protect sensitive information, such as tokens or credentials, from unauthorized access permission.

**Room owner's advanced feature:** allows room owners to have more functions, for example:

- Enable/disable video calling.
- Enable/disable the chat channel.
- Grant/take away the user's code execution permission.
- Grant/take away the user's permission to change the programming language.
- Grant/take away the user's permission to change the user color.
- Remove the user from the room.
- Grant/take away specific users' microphone permission.
- Grant/take away specific users' camera permission.
- Grant/take away specific users' chat permission.
- Give room ownership to other users in the room.

**Enhanced chat feature:** allow users to send pictures, send attachments; implement an anti-spam mechanism.

**Enhanced video calling feature:** allows users to insert filters for the background
of video from the camera, noise filtering, voice fine-tuning, and more.

**Enhancing user experience:** adding more customization possibilities for users such as themes for the code editor, avatars for users on the chat channel, etc.

<br/>

## License

```
MIT License

Copyright (c) 2022 IT's Zoo Team

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
