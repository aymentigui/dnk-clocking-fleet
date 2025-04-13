"use client";
import { Card } from '@/components/ui/card';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Image, Video, FileText, Music, Table, Type, Trash2, AlignVerticalSpaceAround } from 'lucide-react';
import TextEditor from '@/components/myui/text-editor-quill';
import { TableCreator } from '@/components/myui/elements-builder/table-builder';
import ImageUploader from '@/components/myui/elements-builder/image-builder';
import VideoUploader from '@/components/myui/elements-builder/video-builder';
import FileUploader from '@/components/myui/elements-builder/file-builder';
import TitleInput from '@/components/myui/elements-builder/title-builder';
import { useElementsToData, useElementsToHtml } from '@/hooks/use-elements';
import SpaceElement from '@/components/myui/elements-builder/space-builder';

const AddBlogForm = () => {


    return <BlogEditor />;
};

const BlogEditor = () => {
    const [components, setComponents] = useState<any>([]);
    const [htmlContent, setHtmlContent] = useState("");

    const addComponent = (type: any) => {
        setComponents([...components, { id: Date.now(), type }]);
    };

    const removeComponent = (id: any) => {
        setComponents(components.filter((comp: any) => comp.id !== id));
    };

    const handleSubmit = () => {
        const data = useElementsToData(components);
        const content= useElementsToHtml(data)
        
        setHtmlContent(content);
    };

    return (
        <Card className='p-4'>
            <div className='flex flex-col gap-4'>
                {components.map(({ id, type }: any) => (
                    <div key={id} className='border p-4 rounded-md relative'>
                        {type === 'text' && <TextEditor id={"text-" + id} />}
                        {type === 'image' && <ImageUploader id={`file-${id}`} />}
                        {type === 'video' && <VideoUploader id={`file-${id}`} />}
                        {type === 'file' && <FileUploader id={`file-${id}`} />}
                        {type === 'title' && <TitleInput id={`title-${id}`} />}
                        {type === 'space' && <SpaceElement id={`space-${id}`} />}
                        {type === 'table' && <div id={`table-${id}`}><TableCreator /></div>}
                        <Button className='mt-4' variant='destructive' size='sm' onClick={() => removeComponent(id)}>
                            <Trash2 size={16} />
                        </Button>
                    </div>
                ))}

                <AddButton onAdd={addComponent} />
                <Button onClick={handleSubmit} variant='primary' className='mt-4'>Add</Button>
                <div className='border p-4 mt-4' dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </div>
        </Card>
    );
};

const AddButton = ({ onAdd }: any) => {
    const options = [
        { label: 'Texte', type: 'text', icon: <FileText size={18} /> },
        { label: 'Image', type: 'image', icon: <Image size={18} /> },
        { label: 'Vidéo', type: 'video', icon: <Video size={18} /> },
        { label: 'Fichier', type: 'file', icon: <FileText size={18} /> },
        { label: 'Titre grand', type: 'title', icon: <Type size={18} /> },
        { label: 'Space en px', type: 'space', icon: <AlignVerticalSpaceAround  size={18} /> },
        { label: 'Tableau', type: 'table', icon: <Table size={18} /> },
    ];

    return (
        <div className='flex flex-wrap gap-2'>
            {options.map(({ label, type, icon }) => (
                <Button key={type} onClick={() => onAdd(type)} variant='outline' className='flex items-center gap-2'>
                    {icon} {label}
                </Button>
            ))}
        </div>
    );
};



export default AddBlogForm;
