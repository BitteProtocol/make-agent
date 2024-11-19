import { fetch } from "bun";

export async function fetchData(
  url: string,
  options?: RequestInit,
): Promise<any> {
  const response = await fetch(url, options);
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error(`Error fetching data: ${await response.text()}`);
  }
}
