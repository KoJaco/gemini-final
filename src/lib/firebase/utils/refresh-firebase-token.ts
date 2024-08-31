type RefreshTokenResponse = {
    expires_in: string;
    token_type: string;
    refresh_token: string;
    id_token: string;
    user_id: string;
    project_id: string;
};

// TODO: add firebase_api_key

export default async function refreshFirebaseToken(
    refreshToken: string
): Promise<RefreshTokenResponse> {
    const response = await fetch(
        "https://securetoken.googleapis.com/v1/token?key=<firebase_api_key>",
        {
            method: "POST",
            body: JSON.stringify({
                grant_type: "refresh_token",
                refresh_token: refreshToken
            })
        }
    );

    const {
        expires_in,
        token_type,
        refresh_token,
        id_token,
        user_id,
        project_id
    } = await response.json();

    return {
        expires_in,
        token_type,
        refresh_token,
        id_token,
        user_id,
        project_id
    };
}
