"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Play, Pause, StopCircle, Trash2, Send, Mic, X } from 'lucide-react';
import { Slider } from "@/components/ui/slider";
import { duration } from 'moment';

interface AudioClip {
    id: number;
    url: string;
    name: string;
    duration: number; // duration in seconds
}

const MAX_RECORDING_TIME = 60; // Maximum recording time in seconds (1 minute)

const AudioRecorder = () => {
    const [recording, setRecording] = useState(false);
    const [audioClips, setAudioClips] = useState<AudioClip[]>([]);
    const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [recordingTime, setRecordingTime] = useState(0);
    const [durationAudio,setDurationAudio] = useState(0)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunks = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (recording) {
            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => {
                    if (prev + 1 >= MAX_RECORDING_TIME) {
                        stopRecording();
                        return MAX_RECORDING_TIME;
                    }
                    return prev + 1;
                });
            }, 1000);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [recording]);

    useEffect(() => {
        if(durationAudio===0) return
        const lastClip = audioClips[audioClips.length - 1];
        if (lastClip) {
            lastClip.duration = recordingTime;
            setAudioClips((p)=>{
                const clips=audioClips.filter((clip) => clip.id !== lastClip.id);
                setDurationAudio(0)
                return [...clips,lastClip]
            });
            setRecordingTime(0);
        }

    }, [durationAudio]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = (e) => chunks.current.push(e.data);
        mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(chunks.current, { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);
            const newClip = { id: Date.now(), url, name: `Recording ${audioClips.length + 1}`, duration: recordingTime };
            setAudioClips((prev) => {
                setDurationAudio(1)
                return [...prev, newClip]
            });
            chunks.current = [];
        };
        mediaRecorderRef.current.start();
        setRecording(true);
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setRecording(false);
    };

    const cancelRecording = () => {
        mediaRecorderRef.current?.stop();
        chunks.current = [];
        setRecording(false);
        setRecordingTime(0);
    };

    const playAudio = (clip: AudioClip) => {
        currentAudio?.pause();
        const audio = new Audio(clip.url);
        audio.playbackRate = playbackRate;
        audio.play();
        setCurrentAudio(audio);
    };

    const stopAudio = () => {
        currentAudio?.pause();
        setCurrentAudio(null);
    };

    const deleteAudio = (id: number) => {
        setAudioClips(audioClips.filter(clip => clip.id !== id));
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }} className="text-center">
                {!recording ? (
                    <Button onClick={startRecording} className="bg-red-500 hover:bg-red-600">
                        <Mic className="mr-2" /> Start Recording
                    </Button>
                ) : (
                    <div className="flex gap-4 justify-center">
                        <Button onClick={stopRecording} className="bg-green-500 hover:bg-green-600">
                            <StopCircle className="mr-2" /> Stop
                        </Button>
                        <Button onClick={cancelRecording} className="bg-gray-500 hover:bg-gray-600">
                            <X className="mr-2" /> Cancel
                        </Button>
                        <div className="text-lg font-bold">{formatTime(recordingTime)}</div>
                    </div>
                )}
            </motion.div>

            <div className="mt-8">
                {audioClips.map(clip => (
                    <Card key={clip.id} className="mb-4">
                        <CardContent className="flex items-center justify-between">
                            <span>{clip.name} - {formatTime(clip.duration)}</span>
                            <div className="flex gap-2">
                                <Button onClick={() => playAudio(clip)}>
                                    <Play />
                                </Button>
                                <Button onClick={stopAudio}>
                                    <Pause />
                                </Button>
                                <Button onClick={() => deleteAudio(clip.id)} className="bg-red-500 hover:bg-red-600">
                                    <Trash2 />
                                </Button>
                            </div>
                        </CardContent>
                        <CardContent>
                            <Slider min={0.5} max={2} step={0.1} value={[playbackRate]} onValueChange={(val) => setPlaybackRate(val[0])} />
                            <p className="text-sm text-gray-500 mt-2">Playback Speed: {playbackRate.toFixed(1)}x</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default AudioRecorder;
