const optionDefinitions = [
    { name: 'token', alias: 't', type: String },
    {name :'name',alias:'n',type:String},
  ];

const commandLineArgs = require('command-line-args')
const options = commandLineArgs(optionDefinitions)

const token = options.token;
const SpotifyWebApi = require('spotify-web-api-node');
const spotifyApi = new SpotifyWebApi();


async function getTopTracks(){
  // Endpoint reference : https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
  return (await fetchWebApi(
    'v1/me/top/tracks?time_range=long_term&limit=20', 'GET'
  )).items;
}

const getMySavedTracks = async (stepSize = 50) => {
    const tracks = [];
    let offset = 0;
    let response = await spotifyApi.getMySavedTracks({ limit: stepSize, offset });
    tracks.push(...response.body.items);
    while (response.body.next) {
      offset += stepSize;
      response = await spotifyApi.getMySavedTracks({ limit: stepSize, offset });
      tracks.push(...response.body.items);
      console.log(response.body.items.length,offset);
    }
    return tracks;
}

async function moveTracksToPlaylist(tracks,playlistId,stepSize = 40){
    let offset = 0;
    let uris = tracks.map(track => track.track.uri);
    let response = await spotifyApi.addTracksToPlaylist(playlistId,uris.slice(offset,stepSize));
    while (uris.length > offset){
        offset += stepSize;
        response = await spotifyApi.addTracksToPlaylist(playlistId,uris.slice(offset,offset+stepSize));
    }
}

async function moveSavedTracksToPlaylist(){
    const playlist = await spotifyApi.createPlaylist(options.name || `Liked Songs ${new Date().getTime()}`, { 'description': 'Liked songs from Spotify', 'public': true });
    const tracks = await getMySavedTracks();
    
    await moveTracksToPlaylist(tracks,playlist.body.id);

}

async function main(){
    spotifyApi.setAccessToken(token);
    await moveSavedTracksToPlaylist();
}

main();