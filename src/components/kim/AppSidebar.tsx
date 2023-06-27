import {
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Box,
    Button,
    Divider,
    Heading,
    Text,
    Input,
    Spinner,
    VStack,
    Flex,
} from "@chakra-ui/react";
// import { AiOutlinePlusCircle } from "react-icons/ai";
// import { CgDetailsMore } from "react-icons/cg";
import { useState, useEffect } from "react";

import { collection, getDocs, onSnapshot, query } from "firebase/firestore";
import { db } from "../../services/config-db";

import { useNavigate } from "react-router-dom";
import { search } from "ss-search";
import TempAddCompany from "./TempAddCompany";
import { Company, CompanyDetail } from "../../@types/Type";
import AddProject from "./AddProject";

import { useParams } from "react-router-dom";

const Sidebar: React.FC = () => {
    const navigate = useNavigate();
    const params = useParams();
    const [companies, setCompanies] = useState<Company[]>([])
    const [filterCompany, setFilterCompany] = useState<Company[]>([])
    const [isFetching, setIsFetching] = useState(false);
    const [openIndex, setOpenIndex] = useState<number>(-1)

    const onSearch = () => {
        const inputRef = document.getElementById("searchInput") as HTMLInputElement;
        const value = inputRef.value

        const searchField = ["detail.companyName"]
        const result = search(companies, searchField, value) as Company[];
        setFilterCompany(result);
    }

    const fetchingCompany = async () => {
        setIsFetching(true);
        let count = 0;
        const collRef = collection(db, "Company")
        const collData = await getDocs(collRef);
        const allCompany: Company[] = [];

        collData.forEach(i => {
            const company: Company = {
                companyId: i.id,
                detail: i.data() as CompanyDetail,
            }
            if (company.companyId === params["company"]) { setOpenIndex(count) }
            allCompany.push(company)
            count += 1;
        })
        // console.log(allCompany);
        setCompanies(allCompany);
        setFilterCompany(allCompany);

        setIsFetching(false);
    }

    useEffect(() => {
        const collRef = collection(db, "Company")
        const q = query(collRef)
        onSnapshot(q, () => {
            fetchingCompany()
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <Box maxH="100%" position="relative">
            <Heading
                cursor={"pointer"}
                onClick={() => {
                    navigate("/");
                }}
                fontSize={"1.5rem"}
                fontFamily={"inherit"}
                my="1rem"
                w="100%"
                textAlign={"center"}
            >
                CRAFTING LAB
            </Heading>
            <Divider />
            <Box mb="5px">
                <Input placeholder={"Search Company"} w="100%" id="searchInput" onChange={onSearch} />
            </Box>
            {isFetching ?
                <Flex w="100%" justify={"center"} align={"center"}>
                    <Spinner />
                </Flex> :
                <Box>

                    <Accordion allowToggle defaultIndex={[openIndex]}>
                        {
                            filterCompany.map((i, index) => {
                                return (
                                    <AccordionItem key={index} userSelect={"none"}>
                                        <AccordionButton>
                                            <Text fontWeight={params["company"] === i.companyId ? "bold" : "normal"} textAlign={"left"}>{i.detail.companyName}</Text>
                                            <AccordionIcon />
                                        </AccordionButton>
                                        <AccordionPanel>
                                            <VStack fontSize={"0.8rem"} align={"left"} pl="5%">
                                                {i.detail.projects !== undefined ?
                                                    i.detail.projects?.map((j, index) => {
                                                        return (
                                                            <Text
                                                                key={index}
                                                                fontWeight={params["projectID"] === j.id ? "bold" : "normal"}
                                                                cursor={"pointer"}
                                                                _hover={{ fontWeight: "bold" }}
                                                                onClick={() => {
                                                                    // console.log(i.detail.companyName)
                                                                    // console.log(j.projectName)
                                                                    navigate(`/company/${i.companyId}/${j.id}/${j.projectName}/problemReport`)
                                                                }}
                                                            >
                                                                {j.projectName}
                                                            </Text>
                                                        )
                                                    })
                                                    :
                                                    <Text fontWeight={"normal"} textAlign={"center"}>ยังไม่มีข้อมูล Project ของบริษัทนี้</Text>
                                                }
                                                <AddProject companyId={i.companyId} companyName={i.detail.companyName} />
                                                <Button colorScheme="linkedin" fontWeight={"normal"} onClick={() => { navigate(`/company/${i.companyId}`) }}>ข้อมูลลูกค้า/บริษัท</Button>
                                            </VStack>
                                        </AccordionPanel>
                                    </AccordionItem>
                                )
                            })
                        }
                    </Accordion>
                    <Box w="100%" display="flex" justifyContent={"center"} alignItems={"center"} mt="5px">
                        <TempAddCompany />
                    </Box>
                </Box>
            }
        </Box>
    );
};

export default Sidebar;