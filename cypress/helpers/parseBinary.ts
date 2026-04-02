export const parseBinaryResponse = (response: any) => {
    try {
      // Ako je body već objekat, vrati ga
    //   if (typeof response.body === 'object' && response.body !== null) return response;
        
      // Pokušaj dekodiranja (za binarne stringove ili Buffere)
      const decoder = new TextDecoder('utf-8');
      const decodedText = typeof response.body === 'string' 
        ? response.body 
        : decoder.decode(response.body);
      console.log('decodedText', decodedText);
      response.body = JSON.parse(decodedText);
    } catch (e) {
      // Ako nije JSON (npr. stvarno je slika), ostavi kako jeste
      console.warn("Response body is not a valid JSON");
    }
    return response;
  };