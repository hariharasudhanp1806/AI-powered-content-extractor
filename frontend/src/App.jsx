import React, { useState } from 'react'
import axios from 'axios'
const host= import.meta.env.VITE_BACKEND_URL
const App = () => {
  const [url, setUrl]= useState('');
  const [isLoading, setIsLoading]= useState(false);
  const [contentList, setContentList] = useState([]);
  const [search, setSearch]=useState('')

  const handleSummarize = async()=>{
    setIsLoading(true)
    try{
      console.log(`${host}/summarize`);
      
      const res = await axios.post(`${host}/summarize`,{url});
      console.log(res.data)

      if(res.data){
        const result = res.data.result
        const structuredContent = result.map((item) => ({
          summary: item.summary,
          keypoints: item.keypoints,
        }));
        setContentList(structuredContent);
        setUrl('')
      }

      
    }catch(err){
      console.error(`Error fetching data ${err}`)
    }
    
    setIsLoading(false)
  }

  const filteredContent = contentList.filter(
    (item) =>
      item.summary.toLowerCase().includes(search.toLowerCase()) ||
      item.keypoints.join(' ').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1>AI-Powered Content Extractor</h1>
     <div className='inpbox'>
        <input type="text" value={url} placeholder='Enter URL(Try static content page url like wikipedia)' onChange={e=>setUrl(e.target.value)} />
        <button disabled={isLoading} onClick={handleSummarize}> {isLoading? "Summarizing" : "Summarize"}</button>
        <input type="text" placeholder='search' value={search} onChange={e=>setSearch(e.target.value)} />
     </div>
      <table border='1' cellPadding='10'>
        <thead>
          <tr>
            <th>S.No:</th>
            <th>Summary</th>
             {/* <th>Key points</th> */}
          </tr>
        </thead>
        <tbody>
        {filteredContent.length === 0 ? (
            <tr>
              <td colSpan="3">No data found</td>
            </tr>
          ) : (
            filteredContent.map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{item.summary}</td>
                {/* <td>
                  <ul>
                    {item.keypoints.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </td> */}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default App