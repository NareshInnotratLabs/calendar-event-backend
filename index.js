const express = require("express");
const bodyParser = require("body-parser");
const { google } = require("googleapis");
const nodemailer = require("nodemailer");
const cors = require("cors");
const { OAuth2 } = google.auth;

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(
  cors({
    origin: "*",
  })
);

const CLIENT_ID = "1005413984238-8k2vc4kjtaa724h3pvml76eevsglvnpd.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URI = "http://localhost:5000/oauth2callback";
const REFRESH_TOKEN = "1//0gm-QcVnElrXMCgYIARAAGBASNwF-L9IrYw9YYE05zrs6iTFlaIQigVgGkvkHc0KIvC1KTD_BzzhE_DAHH55jd4I5uLFeACb-z00";
const EMAIL_USER = "nodemaileraccess@gmail.com"; // Your email address
const EMAIL_PASS = "xetp turz mtvk cwvy"; // Your email password or app password if 2FA enabled

const oAuth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const createTransporter = async () => {
  const accessToken = await oAuth2Client.getAccessToken();
  return nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465, // Corrected port for secure connection
    secure: true, // Use SSL
    auth: {
      user: EMAIL_USER,
      pass:EMAIL_PASS,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      refreshToken: REFRESH_TOKEN,
      accessToken: accessToken.token,
    },
  });
};

app.get("/", function(req, res){
res.send("Calendar-Event-Schedule-App")
})

app.post("/api/schedule-meeting", async (req, res) => {
  const { name, date, time, email } = req.body;

  console.log('Received data:', name, date, time, email);

  const eventStartTime = new Date(`${date}T${time}:00+05:30`);
  const eventEndTime = new Date(eventStartTime);
  eventEndTime.setHours(eventEndTime.getHours() + 1); // Assuming 1-hour meeting

  console.log('Event start time:', eventStartTime);
  console.log('Event end time:', eventEndTime);

  const event = {
    summary: name,
    start: {
      dateTime: eventStartTime.toISOString(),
      timeZone: "Asia/Kolkata", // Set to India time zone
    },
    end: {
      dateTime: eventEndTime.toISOString(),
      timeZone: "Asia/Kolkata",
    },
    attendees: [{ email: email }],
  };

  try {
    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
      sendUpdates: "all", // This will send email invitations to attendees
    });

    console.log('Event created:', response.data);

    // Send confirmation email
    const transporter = await createTransporter();
    const mailOptions = {
      from: EMAIL_USER,
      to: email,
      subject: "Meeting Scheduled",
      text: `Your meeting "${name}" is scheduled for ${date} at ${time}.`,
    };

    await transporter.sendMail(mailOptions);

    console.log('Confirmation email sent to:', email);

    res.status(200).send(response.data);
  } catch (error) {
    console.error('Error scheduling meeting or sending email:', error); // Detailed error logging
    res.status(500).send({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// 1//0gm-QcVnElrXMCgYIARAAGBASNwF-L9IrYw9YYE05zrs6iTFlaIQigVgGkvkHc0KIvC1KTD_BzzhE_DAHH55jd4I5uLFeACb-z00
// 4/0ATx3LY55S3rNnyTHhIroCZaExYiN-bNAtbxooAvtfzg5I-XsIVklijlmkaoww41ugDYP3w&scope=https://www.googleapis.com/auth/calendar
