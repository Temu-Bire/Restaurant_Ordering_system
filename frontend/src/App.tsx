import {useState, useEffect} from 'react'
import {api} from './api/axios'


export default function App(){
  const [message, setMessage] = useState('Checking....');

  useEffect(() => {
    api.get('/health')
    .then((res) => setMessage(`API: ${res.data.status} DB: ${res.data.database}`))
    .catch(() => setMessage('Could not reach API'));
  }, []);
  
  return (
     <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <h1 className="rounded-lg bg-white p-6 text-xl font-semibold shadow">
        {message}
      </h1>
    </div>
  )
}
