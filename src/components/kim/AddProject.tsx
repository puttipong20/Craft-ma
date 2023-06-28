/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Box,
    Button,
    FormControl,
    HStack,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalOverlay,
    Text,
    useToast,
    useDisclosure,
} from "@chakra-ui/react";
import { useEffect, useState, useContext } from "react";
import moment from "moment";
import { useForm, Controller } from "react-hook-form";

import { collection, addDoc, updateDoc, getDoc, doc } from "firebase/firestore";
import { db } from "../../services/config-db";
import { CompanyDetail, MA, ProjectDetail } from "../../@types/Type";

import { AuthContext } from "../../context/AuthContext";

interface Props {
    companyId: string,
    companyName: string,
}

const AddProject: React.FC<Props> = (props) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { handleSubmit, control, watch, setValue, reset } = useForm()
    const [duration, setDuration] = useState(0);
    const [isAdding, setIsAdding] = useState(false);
    const toast = useToast();
    const Auth = useContext(AuthContext);

    useEffect(() => {
        reset()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const onSubmit = async (data: any) => {
        setIsAdding(true);
        const currentDate = moment().format("YYYY-MM-DD")
        const currentDateTime = moment().format("YYYY-MM-DD HH:mm:ss")
        let status: "advance" | "expire" | "active" | "deleted" | "cancel" = "active";
        if (currentDate >= data.startMA) {
            if (currentDate < data.endMA) {
                status = "active"
            } else {
                status = "expire"
            }
        } else {
            status = "advance"
        }
        const lastestMA: MA = {
            startMA: data.startMA,
            endMA: data.endMA,
            cost: data.cost,
            createdBy: Auth.uid,
            updateLogs: [{ note: "initial Project", timeStamp: currentDateTime, updatedBy: Auth.uid }],
            createdAt: currentDateTime,
            status: status
        }
        const detail: ProjectDetail = {
            companyID: props.companyId,
            companyName: props.companyName,
            createdAt: currentDateTime,
            createdBy: Auth.uid,
            projectName: data.projectName,
            MAlogs: [lastestMA]
        }
        // console.log(detail);
        const companyRef = doc(db, "Company", props.companyId);
        const company = await getDoc(companyRef)
        const companyDetail = company.data() as CompanyDetail;
        const projectRef = collection(db, "Project");
        const newProjectRef = await addDoc(projectRef, detail);
        // console.log(newProjectRef.id, "has been added!")
        const project = {
            id: newProjectRef.id,
            projectName: data.projectName
        }
        let updateProject = []
        if (companyDetail.projects) {
            const allProject = companyDetail.projects
            updateProject = [...allProject, project]
        } else {
            updateProject = [project]
        }
        await updateDoc(companyRef, { projects: updateProject })

        reset();
        onClose();
        toast({
            title: 'เพิ่มโปรเจคสำเร็จ.',
            status: 'success',
            duration: 3000,
            isClosable: true,
            position: "top",
        })
        setIsAdding(false);
    }

    useEffect(() => {
        setValue("companyName", props.companyName)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const startMA = watch("startMA") || moment().format("YYYY-MM-DD")
    const endMA = watch("endMA") || moment().add(1, 'year').format("YYYY-MM-DD")

    const durationData = (startDate: string, endDate: string) => {
        const a = new Date(startDate) as any;
        const b = new Date(endDate) as any;

        const d = (Math.floor((b - a)) / (1000 * 60 * 60 * 24))
        setDuration(d)
    }

    useEffect(() => {
        durationData(startMA, endMA);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startMA, endMA])
    return (
        <Box>
            <Button w="100%" colorScheme='blue' onClick={onOpen} fontWeight={"normal"}>เพิ่ม Project</Button>

            <Modal isOpen={isOpen} onClose={onClose} isCentered={true}>
                <ModalOverlay />
                <ModalContent>
                    <ModalCloseButton />
                    <ModalBody p="2rem">
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <Controller
                                name="companyName"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <FormControl mb="1rem">
                                        <Text fontWeight={"bold"}>บริษัท/ลูกค้า</Text>
                                        <Input type="text" {...field} readOnly />
                                    </FormControl>
                                )}
                            />
                            <Controller
                                name="projectName"
                                control={control}
                                defaultValue={""}
                                render={({ field }) => (
                                    <FormControl mb="1rem" isRequired>
                                        <Text fontWeight={"bold"}>ชื่อโปรเจค</Text>
                                        <Input type="text" {...field} placeholder="project name" />
                                    </FormControl>
                                )}
                            />
                            <HStack>
                                <Controller
                                    name="startMA"
                                    control={control}
                                    defaultValue={moment().format("YYYY-MM-DD")}
                                    render={({ field }) => (
                                        <FormControl mb="1rem" isRequired>
                                            <Text fontWeight={"bold"}>start MA</Text>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                    )}
                                />
                                <Controller
                                    name="endMA"
                                    control={control}
                                    defaultValue={moment().add(1, 'year').format("YYYY-MM-DD")}
                                    render={({ field }) => (
                                        <FormControl mb="1rem" isRequired>
                                            <Text fontWeight={"bold"}>end MA</Text>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                    )}
                                />
                            </HStack>
                            <Text mb="1rem">ระยะเวลา = <Text as="span" fontWeight={"bold"}>{duration}</Text> วัน</Text>
                            {duration < 1 && <Text color="red">ระยะเวลาอย่างน้อย 1 วัน</Text>}
                            <Controller
                                name="cost"
                                control={control}
                                defaultValue={""}
                                render={({ field }) => (
                                    <FormControl mb="1rem" isRequired>
                                        <Text fontWeight={"bold"}>ค่าบริการ</Text>
                                        <Input type="number" min={0} {...field} placeholder="0.00" />
                                    </FormControl>
                                )}
                            />
                            <HStack w="100%" justify={"space-around"} mt="10px">
                                <Button onClick={() => { onClose() }} colorScheme="gray">ปิด</Button>
                                <Button type="submit" colorScheme="blue" isLoading={isAdding} isDisabled={duration < 1}>เพิ่ม</Button>
                            </HStack>
                        </form>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    )
}

export default AddProject;
