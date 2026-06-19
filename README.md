# Brand Pitch Assistant

> Built for Hack Club #beest!

## Description
A full-stack AI workflow tool designed to automate and hyper-personalize sponsorship and marketing pitches. It takes basic inputs about a brand and a product, and generates highly tailored, professional email pitches to increase conversion rates.

## Motivation
Writing personalized outreach emails to hundreds of brands is incredibly tedious and time-consuming. I wanted to build an automated pipeline that scales my outreach without sacrificing the personalized touch that actually gets replies.

## Tech Stack
* Next.js (React)
* TypeScript
* Vercel (Hosting)
* LLM APIs (OpenAI)

## How it Works
The user inputs a brand URL and their own product details into the frontend. The backend fetches high-level context about the target brand and pipes it into an engineered prompt for the LLM. The generated pitch is streamed back to the UI, where it can be edited, copied, and sent.
