"use client"
import React, { useState } from 'react'
import LanguageSwitcher from '../language-switcher'
import { ModeToggle } from '@/components/ui/mode-toggle'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { UserRegisterLogin } from '@/components/ui/user-register-login'

const HeaderPublic = ({ children }: { children?: React.ReactNode }) => {
    const header = useTranslations("Header")
    const [openMenu, setOpenMenu] = useState(false)

    const toggleMenu = () => {
        setOpenMenu((p=>{
            if (!p) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = 'auto';
            }
            return !p;
        }))

    }

    return (
        <div className='w-full p-2 bg-sidebar flex justify-between items-center'>
            {children}
            <div className='flex'>
                {/* Button to toggle the menu on small screens */}
                <button className="lg:hidden p-2" onClick={toggleMenu} >
                    {/* Icon for the menu, can be a hamburger icon */}
                    &#9776;
                </button>
                <nav className={cn("flex flex-col lg:flex-row absolute lg:relative top-0 w-full lg:w-auto h-screen lg:h-auto bg-border lg:bg-transparent justify-center lg:justify-end items-center gap-4 px-8",
                    openMenu ? "left-0" : " left-[-100%] lg:left-0",
                    "transition-all duration-300 ease-in-out z-50",
                )}>
                    <button className="lg:hidden p-2" onClick={toggleMenu} >
                        <X className="w-6 h-6 absolute top-8 right-8" />;
                    </button>
                    <Link href="/" className="hover:underline">{header("home")}</Link>
                    <Link href="/blogs" className="hover:underline">{header("blogs")}</Link>
                    <Link href="/contact" className="hover:underline">{header("contactus")}</Link>
                    <Link href="/about" className="hover:underline">{header("aboutus")}</Link>
                </nav>
            </div>
            <div className='flex gap-2'>
                <LanguageSwitcher />
                <ModeToggle />
                <UserRegisterLogin />
            </div>
        </div>
    )
}

export default HeaderPublic
