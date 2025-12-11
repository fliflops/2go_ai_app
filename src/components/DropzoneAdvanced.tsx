import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, X, FileIcon, Loader2, CheckCircle2, AlertCircle, Image as ImageIcon, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FileWithPreview extends File {
  preview?: string
}

interface DropzoneAdvancedProps {
  apiEndpoint: string
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
  maxSize?: number
  maxFiles?: number
  accept?: Record<string, string[]>
  queryKey?: string[]
  showPreviews?: boolean
}

export function DropzoneAdvanced({
  apiEndpoint,
  onSuccess,
  onError,
  maxSize = 10 * 1024 * 1024,
  maxFiles = 5,
  accept,
  queryKey,
  showPreviews = true
}: DropzoneAdvancedProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const queryClient = useQueryClient()

  const uploadMutation = useMutation({
    mutationFn: async ({ file, onProgress }: { file: File; onProgress: (progress: number) => void }) => {
      const formData = new FormData()
      formData.append('file', file)

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100)
            onProgress(progress)
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText)
              resolve(data)
            } catch (e) {
              resolve(xhr.responseText)
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`))
          }
        }

        xhr.onerror = () => reject(new Error('Upload failed'))

        xhr.open('POST', apiEndpoint)
        xhr.send(formData)
      })
    },
    onSuccess: (data) => {
      if (queryKey) {
        queryClient.invalidateQueries({ queryKey })
      }
      onSuccess?.(data)
    },
    onError: (error: Error) => {
      onError?.(error)
    }
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const filesWithPreview = acceptedFiles.map(file => {
      const fileWithPreview = file as FileWithPreview
      if (file.type.startsWith('image/')) {
        fileWithPreview.preview = URL.createObjectURL(file)
      }
      return fileWithPreview
    })
    setFiles(prev => [...prev, ...filesWithPreview])
    uploadMutation.reset()
  }, [])

  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } = useDropzone({
    onDrop,
    maxSize,
    maxFiles,
    accept,
    multiple: maxFiles > 1
  })

  const handleUploadAll = async () => {
    for (const file of files) {
      await uploadMutation.mutateAsync({
        file,
        onProgress: (progress) => {
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }))
        }
      })
    }
  }

  const handleRemove = (index: number) => {
    const file = files[index]
    if (file.preview) {
      URL.revokeObjectURL(file.preview)
    }
    setFiles(files.filter((_, i) => i !== index))
    setUploadProgress(prev => {
      const newProgress = { ...prev }
      delete newProgress[file.name]
      return newProgress
    })
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5" />
    }
    return <FileText className="h-5 w-5" />
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Dropzone Area */}
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300",
          "bg-linear-to-br from-gray-50 to-gray-100",
          "hover:from-blue-50 hover:to-indigo-50 hover:border-blue-400 hover:shadow-lg",
          isDragActive && !isDragReject && "border-blue-500 bg-linear-to-br from-blue-100 to-indigo-100 scale-[1.01] shadow-xl",
          isDragReject && "border-red-500 bg-red-50",
          files.length > 0 && "border-green-400"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            "relative p-4 rounded-full transition-all duration-300",
            isDragActive ? "bg-blue-500 scale-110" : "bg-linear-to-br from-blue-500 to-indigo-600"
          )}>
            <Upload className="h-12 w-12 text-white" />
          </div>
          
          <div>
            <p className="text-xl font-bold text-gray-800">
              {isDragActive ? "Drop files here!" : "Drag & drop files"}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              or click to browse • Max {maxFiles} files • {formatFileSize(maxSize)} each
            </p>
          </div>

          {accept && (
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {Object.keys(accept).map(type => (
                <span key={type} className="px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-600 border border-gray-200">
                  {type}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* File Rejections */}
      {fileRejections.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">
                Files rejected
              </p>
              <ul className="mt-2 space-y-1">
                {fileRejections.map(({ file, errors }) => (
                  <li key={file.name} className="text-sm text-red-700">
                    <span className="font-medium">{file.name}</span>
                    {errors.map(e => (
                      <span key={e.code} className="block text-xs text-red-600 ml-2">
                        • {e.message}
                      </span>
                    ))}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Selected Files Grid */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">
              Selected Files ({files.length}/{maxFiles})
            </h3>
            <Button
              onClick={handleUploadAll}
              disabled={uploadMutation.isPending || files.length === 0}
              className="bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload All
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="relative group bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-lg transition-all duration-200"
              >
                {/* Preview or Icon */}
                {showPreviews && file.preview ? (
                  <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full h-32 mb-3 rounded-lg bg-linear-to-br from-blue-50 to-indigo-50">
                    <div className="bg-blue-500 rounded-full p-4">
                      {getFileIcon(file)}
                      <FileIcon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                )}

                {/* File Info */}
                <div className="space-y-1">
                  <p className="font-semibold text-sm text-gray-900 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>

                {/* Progress Bar */}
                {uploadProgress[file.name] !== undefined && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Uploading...</span>
                      <span>{uploadProgress[file.name]}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-linear-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress[file.name]}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Remove Button */}
                <button
                  onClick={() => handleRemove(index)}
                  disabled={uploadMutation.isPending}
                  className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-red-50 hover:shadow-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                >
                  <X className="h-4 w-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Status */}
      {uploadMutation.isSuccess && (
        <div className="bg-linear-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 rounded-full p-2">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-800">
                All files uploaded successfully!
              </p>
              <p className="text-xs text-green-600 mt-0.5">
                Your files are now available
              </p>
            </div>
          </div>
        </div>
      )}

      {uploadMutation.isError && (
        <div className="bg-linear-to-r from-red-50 to-rose-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm font-semibold text-red-800">
                Upload failed
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                {uploadMutation.error.message}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
