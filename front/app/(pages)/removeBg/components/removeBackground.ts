export async function removeBackground(imageFile: File): Promise<Blob> {
    const formData = new FormData();
    formData.append("image_file", imageFile);
    formData.append("size", "auto");
    formData.append("format", "png");
    formData.append("type", "auto");
    //FZpX3YQKX2xUSoA7xhaH2twy
    //eTWHss5xR5moSEBYyX4fALQ6
    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: {
            "X-Api-Key": "eTWHss5xR5moSEBYyX4fALQ6",
        },
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`remove.bg error: ${response.status} - ${errorText}`);
    }

    return await response.blob();
}

// const url = "https://sdk.photoroom.com/v1/segment";
// const apiKey = "sandbox_sk_pr_default_7da0d748fea4c0fea4b0e19a2d618a152c1fde9f"; // ⚠️ This will be public

// export async function removeBackground(imageFile: File): Promise<Blob> {
//     const formData = new FormData();
//     formData.append("image_file", imageFile);

//     const response = await fetch(url, {
//         method: "POST",
//         headers: {
//             "X-Api-Key": apiKey,
//         },
//         body: formData,
//     });

//     if (!response.ok) {
//         const error = await response.text();
//         throw new Error(error);
//     }

//     return await response.blob();
// }
