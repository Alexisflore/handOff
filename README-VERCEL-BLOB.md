# Using Vercel Blob in this Project

This project uses [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) for file storage. Here's how to set it up and use it.

## Configuration

1. Create a `.env.local` file in the root of your project (if it doesn't exist already)
2. Add the following environment variable:
   ```
   BLOB_READ_WRITE_TOKEN=your_token_here
   ```
3. You can get a token from the Vercel dashboard:
   - Go to your Vercel project
   - Navigate to Storage > Blob
   - Create a new token with read+write permissions

## Implementation Details

### API Routes

The project includes two API routes:

1. `/api/upload` - For uploading files to Vercel Blob
2. `/api/versions` - For saving version metadata to the database

### Components

- `FileUploader` - A reusable component for file uploads
- `AddVersionModal` - Uses the FileUploader to add new versions

### Utilities

- `lib/upload.ts` - Helper functions for file uploads and validation

## Usage Examples

### Uploading a File

```typescript
import { uploadFile } from "@/lib/upload";

// In an event handler
const handleUpload = async (file: File) => {
  try {
    const url = await uploadFile(file, "project-versions");
    console.log("File uploaded to:", url);
  } catch (error) {
    console.error("Upload failed:", error);
  }
};
```

### Using the FileUploader Component

```tsx
import { FileUploader } from "@/components/ui/file-uploader";

export default function YourComponent() {
  const handleFileUploaded = (url: string, file: File) => {
    console.log("File uploaded to:", url);
    console.log("File info:", file.name, file.type, file.size);
  };

  return (
    <FileUploader 
      onUploadComplete={handleFileUploaded} 
      folder="my-uploads" 
      maxSizeInMB={10}
      allowedTypes={["application/pdf", "image/jpeg"]}
    />
  );
}
```

## Additional Resources

- [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob)
- [Pricing Information](https://vercel.com/docs/storage/vercel-blob/pricing) 