import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, X, FileIcon, Loader2, CheckCircle2, AlertCircle, Cloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DropzoneUploadProps {
  apiEndpoint: string
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
  maxSize?: number // in bytes
  maxFiles?: number
  accept?: Record<string, string[]> // e.g., { 'image/*': ['.png', '.jpg'] }
  queryKey?: string[]
}

export function DropzoneUpload({
  apiEndpoint,
  onSuccess,
  onError,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 1,
  accept,
  queryKey
}: DropzoneUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const queryClient = useQueryClient()

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      return response.json()
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
    setFiles(acceptedFiles)
    uploadMutation.reset()
  }, [])

  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } = useDropzone({
    onDrop,
    maxSize,
    maxFiles,
    accept,
    multiple: maxFiles > 1
  })

  const handleUpload = () => {
    if (files.length > 0) {
      files.forEach(file => {
        uploadMutation.mutate(file)
      })
    }
  }

  const handleRemove = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
    uploadMutation.reset()
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Dropzone Area */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
          "hover:border-blue-400 hover:bg-blue-50/50",
          isDragActive && !isDragReject && "border-blue-500 bg-blue-50 scale-[1.02]",
          isDragReject && "border-red-500 bg-red-50",
          files.length > 0 && "border-green-500 bg-green-50/30"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4">
          {isDragActive ? (
            <>
              <Cloud className="h-16 w-16 text-blue-500 animate-bounce" />
              <div>
                <p className="text-lg font-semibold text-blue-600">
                  Drop your files here
                </p>
                <p className="text-sm text-blue-500 mt-1">
                  Release to upload
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                <Upload className="h-16 w-16 text-gray-400" />
                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                  <Cloud className="h-4 w-4 text-white" />
                </div>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-700">
                  Drag & drop files here
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  or click to browse from your computer
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>Max size: {formatFileSize(maxSize)}</span>
                <span>•</span>
                <span>Max files: {maxFiles}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* File Rejections */}
      {fileRejections.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">
                Some files were rejected:
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

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">
            Selected Files ({files.length})
          </h3>
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-4 bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="bg-blue-500 rounded-lg p-2">
                  <FileIcon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-sm text-gray-600">
                    {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleRemove(index)}
                disabled={uploadMutation.isPending}
                className="ml-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {/* Upload Button */}
          {!uploadMutation.isSuccess && (
            <Button
              onClick={handleUpload}
              disabled={uploadMutation.isPending || files.length === 0}
              className="w-full bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              size="lg"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  Upload {files.length} {files.length === 1 ? 'File' : 'Files'}
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Upload Status */}
      {uploadMutation.isSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 rounded-full p-1">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-800">
                Upload successful!
              </p>
              <p className="text-xs text-green-600 mt-0.5">
                Your files have been uploaded successfully
              </p>
            </div>
          </div>
        </div>
      )}

      {uploadMutation.isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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
