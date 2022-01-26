import React, {useState, useEffect} from 'react';
import {ethers} from 'ethers';
import { contractABI, contractAddress } from '../utils/constants';

export const TransactionContext = React.createContext();
const {ethereum} = window;

const getEthereumContract = () => {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    return new ethers.Contract(contractAddress, contractABI, signer);
}

export const TransactionProvider = ({children}) => {
    const [connectedAccount, setConnectedAccount] = useState('');
    const [formData, setFormData] = useState({ address_to: '', amount: '', keyword: '', message: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [transactionCount, setTransactionCount] = useState(localStorage.getItem('transactionCount') || 0);
    const [transactions, setTransactions] = useState([])

    const handleChange = (e, name) => {
        setFormData({ ...formData, [name]: e.target.value });
    }

    const getAllTransactions = async () => {
        try {
            if (!ethereum) return alert('Please install and connect to MetaMask')
            const contract = getEthereumContract()
            const availableTransactions = await contract.getAllTransactions()
            const structuredTransactions = availableTransactions.map(transaction => ({
                addressTo : transaction.receiver,
                addressFrom : transaction.sender,
                timestamp : new Date(transaction.timestamp.toNumber() * 1000).toLocaleString(),
                message : transaction.message,
                keyword : transaction.keyword,
                amount : parseInt(transaction.amount._hex) / (10 ** 18)
            }))
            setTransactions(structuredTransactions);
        }catch (e) {
            console.log(error);
            throw new Error('No ethereum object');
        }
    }

    const checkIfWalletIsConnected = async () => {
        try {
            if(!ethereum) {
                return alert('Please install and connect to MetaMask');
            }
            const accounts = await ethereum.request({method: 'eth_accounts'});
            if(accounts.length) {
                setConnectedAccount(accounts[0]);
                getAllTransactions()
            } else {
                console.log('Please connect to MetaMask');
            }
        } catch (error) {
            console.log(error);
            throw new Error('No ethereum object');
        }
    }

    const checkIfTransactionsExists = async () => {
        try {
            const contract = getEthereumContract();
            const transactionCount = await contract.getTransactionCount()

            window.localStorage.setItem('transactionCount', transactionCount)
        }catch (e) {
            console.log(e)
            throw new Error('No ethereum object')
        }
    }

    const connectWallet = async () => {
        try {
            if(!ethereum) {
                return alert('Please install and connect to MetaMask');
            }
            const accounts = await ethereum.request({method: 'eth_requestAccounts', connectedAccount});
            setConnectedAccount(accounts[0]);
        } catch (error) {
            console.log(error);
            throw new Error('No ethereum object');
        }
    }
    const sendTransaction = async (transaction) => {
        try {
            if(!ethereum) {
                return alert('Please install and connect to MetaMask');
            }
            const { address_to, amount, keyword, message } = formData;
            const contract = getEthereumContract();
            const parsedAmount = ethers.utils.parseEther(amount);
            await ethereum.request({method: 'eth_sendTransaction', params : {
                from : connectedAccount,
                to : address_to,
                gas : '0x5208', // 21000 Gwei
                value : parsedAmount._hex, // 0.0001 ETH
            }});
            const transactionHash = await contract.addToBlockChain(address_to, parsedAmount, message, keyword);
            setIsLoading(true);
            console.log('Transaction hash: ', transactionHash.hash);
            await transactionHash.wait();
            setIsLoading(false);
            console.log('Success : ', transactionHash.hash);
            const transactionCount = await contract.getTransactionCount();
            setTransactionCount(transactionCount.toNumber());
        } catch (error) {
            console.log(error);
            throw new Error('No ethereum object');
        }
    }

    useEffect(() => {
        checkIfWalletIsConnected()
        checkIfTransactionsExists()
    }, []);

    return (
        <TransactionContext.Provider value={{ connectWallet, transactions, connectedAccount, isLoading, formData, handleChange, sendTransaction }}>
            {children}
        </TransactionContext.Provider>
    )
}