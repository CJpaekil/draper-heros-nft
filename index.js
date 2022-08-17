	"use strict";
  import * as abi from "./abi/utility.json";

  const nft_contract_abi = abi;
  const nft_contract_address = "0x6eeaB0C2A382cEC2614CafC38FE639F73783032E";
    
  const Web3Modal = window.Web3Modal.default;
  const WalletConnectProvider = window.WalletConnectProvider.default;

  let web3Modal;
  let provider;
  let selectedAccount;
  let userBalanceInEth;
  let contract;
  let web3;
  let set_chain_id = 4; // Rinkby testnet chain Id
  let curr_chain_id;
  let connect_flag = false;
  let mintPrice = 0.001;
  let mintContract;

  function init() {
    const providerOptions = {
      disableInjectedProvider: true,
      injected: {
        display: {
          name: "MetaMask",
          description: "For desktop web wallets",
        },
        package: null,
      },
      walletconnect: {
        display: {
          name: "WalletConnect",
          description: "For mobile app wallets",
        },
        package: WalletConnectProvider,
        options: {
          infuraId: "9dc4155e7a854e189deaeb47a1f7dd71",
        },
      },
    };

    web3Modal = new Web3Modal({
      network: "mainnet",
      cacheProvider: false,
      providerOptions,
      theme: {
        background: "rgb(39, 49, 56)",
        main: "rgb(199, 199, 199)",
        secondary: "rgb(136, 136, 136)",
        border: "rgba(195, 195, 195, 0.14)",
        hover: "rgb(16, 26, 32)",
      },
    });
  }

  async function fetchAccountData() {
    web3 = new Web3(provider);

    const chainId = await web3.eth.getChainId();
    curr_chain_id = chainId;

    if(set_chain_id == curr_chain_id) {
      const accounts = await web3.eth.getAccounts();
      selectedAccount = accounts[0];
      let userBalance = await web3.eth.getBalance(selectedAccount);
      userBalanceInEth = await web3.utils.fromWei(userBalance, "ether");
      $("#balance").text(parseFloat(userBalanceInEth).toFixed(3) + " ETH");
      
      try {
      	mintContractConnect(nft_contract_abi, nft_contract_address);
      } catch (ex) {
      	console.log("NFT mint contract error: ", ex);
      }
   
      console.log(selectedAccount, userBalanceInEth);
      //$.cookie("connect", 'true');
      connect_flag = true;
    } else {
      //$.cookie("connect", 'false');
      alert("Please change to Rinkby Testnet!");
    }
  }

  async function refreshAccountData() {

    await fetchAccountData(provider);
    if(set_chain_id == curr_chain_id) {

    }
  }

  async function onConnect() {
    try {
      provider = await web3Modal.connect();
    } catch (e) {
      console.log("Could not get a wallet connection", e);
      return;
    }
    provider.on("accountsChanged", (accounts) => {
      fetchAccountData();
    });
    provider.on("chainChanged", (chainId) => {
      fetchAccountData();
    });

    provider.on("disconnect", (error) => {
      onDisconnect();
    });
    await refreshAccountData();
  }

  async function onDisconnect() {

    if (provider.close) {
      await provider.close();
      await web3Modal.clearCachedProvider();
      provider = null;
    }

    selectedAccount = null;

    //$.cookie("connect", 'false');
    connect_flag = false;
  }
  
  async function mintContractConnect(ABI, ADDRESS) {
  	mintContract = new web3.eth.Contract(ABI, ADDRESS);
  }
  
  async function nftMint(amount) {
  	try {
      let nft_price = amount * mintPrice;
      console.log(Number(userBalanceInEth), nft_price, nft_price <= 0);
      if(connect_flag) {
        if(nft_price <= 0) {
          alert("Select at least 1 NFT");
        } else {
        	if(nft_price >= Number(userBalanceInEth)) {
          	alert("Insufficient ETH Balance");
          	return ;
          }
          await mintContract.methods.mintNFT(amount)
            .send({from: selectedAccount, value: await web3.utils.toWei(nft_price.toString(), "ether")})
            .on("receipt", function(res) { alert("Mint Successful") })
            .on("error", function(err) { alert("Mint Error"); console.log("Transaction Error: ", err) });
        }
      } else {
        alert("Please connect to Rinkby Testnet!");
      }
    } catch(ex) {
      console.log("error: ", ex);
    }
  }
    
	$(function() {
  	init();
   
   	$("#amount").val(1);
    $("#totalCost").text("0.001 ETH")
    
    // For Metamask connect
		$(".wallet_connect").click(function(event) {
    	onConnect();
    })
    
    // When change the NFT amount for calc the NFT price
    $("#amount").change(function() {
    	try {
      	$("#totalCost").text(($(this).val() * mintPrice).toFixed(3) + " ETH");	
      } catch (e) {
      	console.log("amount error!");
      }
    })
    
    // For mint 
    $("#mint").click(function() {
			 nftMint($("#amount").val());
    })
    
  })