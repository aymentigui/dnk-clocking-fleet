import React from 'react'
import FileUploadForm from './_component/forms/upload-files'
import ListFilesSansPreview from './_component/list-files'
import ListFilesWithPreview from './_component/list-files-preview'

const Test = () => {

  return (
    <div>
      <FileUploadForm />
      <ListFilesSansPreview />
      <ListFilesWithPreview />
    </div>
  )
}

export default Test
