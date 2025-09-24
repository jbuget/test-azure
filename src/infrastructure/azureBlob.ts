import { BlobServiceClient } from '@azure/storage-blob';

const connectionString = process.env.AZURE_BLOB_CONNECTION_STRING;
const containerName = process.env.AZURE_BLOB_CONTAINER || 'contacts';

if (!connectionString) {
  // eslint-disable-next-line no-console
  console.warn('AZURE_BLOB_CONNECTION_STRING is not set. Photo features will fail.');
}

const blobService = connectionString ? BlobServiceClient.fromConnectionString(connectionString) : undefined;
const containerClient = blobService ? blobService.getContainerClient(containerName) : undefined;

async function ensureContainer() {
  if (!containerClient) return;
  try {
    await containerClient.createIfNotExists();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Azure container createIfNotExists failed:', e);
  }
}

ensureContainer();

export async function uploadBuffer(blobName: string, buffer: Buffer, contentType?: string) {
  if (!containerClient) throw new Error('Azure Blob Storage not configured');
  const blockBlob = containerClient.getBlockBlobClient(blobName);
  await blockBlob.uploadData(buffer, { blobHTTPHeaders: { blobContentType: contentType || 'application/octet-stream' } });
}

export async function deleteBlob(blobName: string) {
  if (!containerClient) throw new Error('Azure Blob Storage not configured');
  try {
    await containerClient.deleteBlob(blobName);
  } catch (e: any) {
    if (e?.statusCode === 404) return;
    throw e;
  }
}

export async function getBlobDownload(blobName: string) {
  if (!containerClient) throw new Error('Azure Blob Storage not configured');
  const blobClient = containerClient.getBlobClient(blobName);
  const exists = await blobClient.exists();
  if (!exists) return undefined;
  const dl = await blobClient.download();
  return {
    stream: dl.readableStreamBody!,
    contentType: dl.contentType || 'application/octet-stream',
    contentLength: Number(dl.contentLength || 0),
    etag: dl.etag,
    lastModified: dl.lastModified,
  };
}

