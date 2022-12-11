import * as React from 'react';
import { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Image from 'mui-image';
import TextField from '@mui/material/TextField';
import TextField from '@mui/material/TextField';

import peExt from './images/temp_extractor.png';
import peExtbw from './images/extractor_bw.png';
import { Divider, Divider, Grid, Paper } from '@mui/material';
import { Box } from '@mui/system';
import { extractorLogicReadable, extractorLogicWritable, extractorTokenReadable, extractorTokenWritable, peTokenReadable } from './smart_contracts/MoonbaseConfig';


function ExtractorSection(props) {

    // React variables
    const [extractionRateo, setExtractionRateo] = useState(0);
    const [redeemableTokens, setRedeemableTokens] = useState(0);
    const [blocksToNextClaim, setBlocksToNextClaim] = useState(0);
    const [peBalance, setPeBalance] = useState(0);
    const [stakedExtractors, setStakedExtractors] = useState(0);
    const [freeExtractors, setFreeExtractors] = useState(0);
    const [message, setMessage] = useState('');



    // Smart contract variables
    const EXTRACTOR_TOKEN_ID = 1;

    // Get a readable time for the next token claim
    function getNextClaimTime(blocksToWait) {
        if (blocksToWait === 0) {
            return "NOW!";
        } else {
            var secondsTime = blocksToWait * 12;    // 12 seconds to mine a block on Moonbase Alpha
            let hours = Math.floor(secondsTime / 3600);
            secondsTime = secondsTime - 3600 * hours;
            let minutes = Math.floor(secondsTime / 60);
            secondsTime = secondsTime - 60 * minutes;
            return hours + "h " + minutes + "m " + secondsTime + "s";
        }
    }

    // Call claim function
    function claimTokens() {
        extractorLogicWritable.claimTokens()
            .then(_claimedTokens => {
                console.log("Claimed %d tokens", _claimedTokens);
            })
            .catch(error => {
                console.log(error);
            });
    }

    const handleChange = event => {
        setMessage(event.target.value);

        console.log('Extractors to management value:', event.target.value);
    };

    const depositExtractors = () => {
        const extractorsToManage = parseInt(message);
        extractorLogicWritable.depositExtractors(extractorsToManage)
            .then(() => {
                console.log("Depositing %d extractors...", extractorsToManage)
            })
            .catch(error => {
                console.log(error);
            });
    };

    const withdrawExtractors = () => {
        const extractorsToManage = parseInt(message);
        extractorLogicWritable.withdrawExtractors(extractorsToManage)
            .then(() => {
                console.log("Withdrawing %d extractors...", extractorsToManage)
            })
            .catch(error => {
                console.log(error);
            });
    }


    useEffect(() => {

        if (props.address !== "") {

            const USER_WALLET = props.address;

            // Retrieve token balance from chain
            peTokenReadable.balanceOf(USER_WALLET)
                .then(balance => {
                    console.log("PE token balance: %d", balance);
                    const ownedTokens = balance / 10 ** 18;
                    setPeBalance(ownedTokens);
                })
                .catch(error => {
                    console.log(error);
                });

            // Retrieve free extractor from chain
            extractorTokenReadable.balanceOf(USER_WALLET, "" + EXTRACTOR_TOKEN_ID)
                .then(freeTokens => {
                    const _freeExtractors = parseInt("" + freeTokens);
                    setFreeExtractors(_freeExtractors);
                    console.log("Free extractors: %d", _freeExtractors);
                })
                .catch(error => {
                    console.log(error);
                });

            // Retrieve deposited extractors from chain
            extractorLogicReadable.getDepositedExtractors(USER_WALLET)
                .then(_depositedExtractors => {
                    console.log("Deposited extractors: %d", _depositedExtractors);
                    const depositedPoisonExtractors = parseInt("" + _depositedExtractors);
                    setStakedExtractors(depositedPoisonExtractors);

                    // Retrieve extraction rate from chain
                    if (stakedExtractors !== 0) {
                        extractorLogicReadable.getExtractionRate(stakedExtractors)
                            .then(_calculatedRate => {
                                let currentRate = (_calculatedRate / (10 ** 18) * 7200).toFixed(5);
                                console.log("Current extraction rate per day %f", currentRate);
                                setExtractionRateo(currentRate);
                            })
                            .catch(error => {
                                console.log(error);
                            })
                    } else {
                        console.log("Zero extractors staked...");
                    }

                })
                .catch(error => {
                    console.log(error);
                });

            // Retrieve deposited extractors from chain
            extractorLogicWritable.getClaimableTokens()
                .then(_claimableTokens => {
                    let currentClaimableAmount = (parseInt(_claimableTokens + "") / (10 ** 18)).toFixed(2);;
                    console.log("Claimable PE tokens %f", currentClaimableAmount);
                    setRedeemableTokens(currentClaimableAmount);
                });

            // Retrieve blocks before next claim
            extractorLogicReadable.getBlocksBeforeNextClaim(USER_WALLET)
                .then(_blocksToWait => {
                    console.log("Block to wait for next claim: %d", _blocksToWait);
                    let blocks = parseInt("" + _blocksToWait);
                    setBlocksToNextClaim(blocks);
                })
                .catch(error => {
                    console.log(error);
                })
        }

    });


    return (
        <Box >
            <Grid sx={{ mb: 5 }} container spacing={5}>
                <Grid item xs={6}>
                    <Paper className='extractorBackground' elevation={24} sx={{ borderRadius: 8 }}>
                        <Box p={1}>
                            <Image src={stakedExtractors === 0 ? peExtbw : peExt} alt="extractor gif" elevation={24} />
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={6}>
                    <Box className='extDataBox' p={1} sx={{ borderRadius: 8, mb: 10, p: 3 }} >
                        <Typography sx={{ ml: 1, color: 'white' }} variant='h5'>
                            Extraction rate: {extractionRateo} PE/day
                        </Typography>
                        <Typography sx={{ ml: 1, color: 'white' }} variant='h5'>
                            Redeemable tokens: {redeemableTokens} PE
                        </Typography>
                        <Typography sx={{ ml: 1, mb: 3.5, color: 'white' }} variant='h5'>
                            Time to next available claim: {getNextClaimTime(blocksToNextClaim)}
                        </Typography>

                        <Grid container spacing={0} >
                            <Grid item xs={3.5}>
                                <Button sx={{ backgroundColor: '#a1c126', ml: 1, mt: 1, borderRadius: 2 }} variant="contained" size='large' fullWidth onClick={claimTokens}>
                                    CLAIM
                                </Button>
                            </Grid>
                            <Grid item xs={8.5} sx={{ display: 'flex', alignItems: 'end' }}>
                                <Box sx={{ mt: 2.5 }}>
                                    <Typography sx={{ fontSize: 15, ml: 3, color: 'white' }} variant='overline' >
                                        Owned tokens: {peBalance.toFixed(2)} PE
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>

                    </Box>

                    <Box className='extDataBox' p={1} sx={{ borderRadius: 8, pt: 3, pb: 3, pl: 3, pr: 5 }} >
                        <Typography sx={{ ml: 1, color: 'white' }} variant='h5'>
                            Owned Extractors: {stakedExtractors + freeExtractors}
                        </Typography>
                        <Typography sx={{ ml: 1, color: 'white' }} variant='h5'>
                            Free Extractors: {freeExtractors}
                        </Typography>
                        <Typography sx={{ ml: 1, mb: 3.5, color: 'white' }} variant='h5'>
                            Extractors in staking: {stakedExtractors}
                        </Typography>

                        <Grid container spacing={1} >
                            <Grid item xs={5}>
                                <TextField
                                    required
                                    id="message"
                                    name="message"
                                    onChange={handleChange}
                                    label="Extractors number"
                                    defaultValue="0"
                                    className="textFieldCustom" />
                            </Grid>
                            <Grid item xs={3}>
                                <Button sx={{ backgroundColor: '#a1c126', ml: 1, borderRadius: 2 }} variant="contained" size='small' fullWidth onClick={depositExtractors}>
                                    Deposit
                                </Button>
                            </Grid>
                            <Grid item xs={3}>
                                <Button sx={{ backgroundColor: '#a1c126', ml: 1, borderRadius: 2 }} variant="contained" size='small' fullWidth onClick={withdrawExtractors}>
                                    Withdraw
                                </Button>
                            </Grid>
                        </Grid>

                        <a href="https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/105358272762175259458146981548426915326652569204453104744298191896506852704456" rel="noreferrer">
                            <Button sx={{ color: '#a1c126', backgroundColor: "#303030", border: 3, borderColor: '#a1c126', ml: 1, mt: 1, borderRadius: 2 }} variant="contained" size="large" fullWidth>
                                Buy new Extractor
                            </Button>
                        </a>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
} export default ExtractorSection;