"use server"
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    // Configurez ici votre service d'envoi d'emails
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
})

export async function sendEmail(to: string, subject: string, html: string) {
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('Email configuration is missing')
        return
    }
    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
    })
}